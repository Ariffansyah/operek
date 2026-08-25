"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/paymenku";
import { getCart, getSellerBalance } from "@/lib/data";
import { syncTransaction } from "@/lib/payments";
import { MIN_WITHDRAWAL, formatRupiah, platformFee } from "@/lib/utils";

async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function addToCart(listingId: string) {
  const user = await requireUser();

  const { data: listing } = await admin
    .from("listings")
    .select("seller_id, is_active")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing?.is_active) return { error: "Iklan sudah tidak aktif." };
  if (listing.seller_id === user.id)
    return { error: "Kamu tidak bisa membeli barangmu sendiri." };

  const { error } = await admin
    .from("cart_items")
    .upsert(
      { user_id: user.id, listing_id: listingId, quantity: 1 },
      { onConflict: "user_id,listing_id", ignoreDuplicates: true },
    );

  if (error) return { error: "Gagal menambah ke keranjang." };
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setCartQuantity(cartItemId: string, quantity: number) {
  const user = await requireUser();
  const next = Math.max(1, Math.min(99, Math.trunc(quantity)));

  await admin
    .from("cart_items")
    .update({ quantity: next })
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItem(cartItemId: string) {
  const user = await requireUser();
  await admin.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleSaved(listingId: string) {
  const user = await requireUser();

  const { data: existing } = await admin
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("saved_listings")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
  } else {
    await admin
      .from("saved_listings")
      .insert({ user_id: user.id, listing_id: listingId });
  }

  revalidatePath("/discover");
  return { saved: !existing };
}

export async function checkout(deliveryMethod: string) {
  const user = await requireUser();
  const cart = await getCart(user.id);
  if (!cart.length) return { error: "Keranjang masih kosong." };

  const supabase = await createClient();
  const listingIds = cart.map((item) => item.listing_id);

  const { data: claimed } = await admin
    .from("transactions")
    .select("id, listing_id, buyer_id, status, paymenku_payment_url")
    .in("listing_id", listingIds)
    .in("status", ["pending", "diproses", "dikirim", "selesai"]);

  for (const row of claimed ?? []) {
    await syncTransaction(row.id as string);
  }

  const { data: stillClaimed } = await admin
    .from("transactions")
    .select("id, listing_id, buyer_id, status, paymenku_payment_url")
    .in("listing_id", listingIds)
    .in("status", ["pending", "diproses", "dikirim", "selesai"]);

  const mine = (stillClaimed ?? []).find(
    (r) => r.buyer_id === user.id && r.status === "pending",
  );
  if (mine?.paymenku_payment_url) {
    redirect(mine.paymenku_payment_url as string);
  }

  if (stillClaimed?.length) {
    return {
      error: "Barang ini sedang diproses pembeli lain. Coba beberapa saat lagi.",
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.listing?.price ?? 0) * item.quantity,
    0,
  );
  const fee = platformFee(subtotal);

  const rows = cart.map((item) => {
    const lineSubtotal = (item.listing?.price ?? 0) * item.quantity;
    return {
      buyer_id: user.id,
      seller_id: item.listing!.seller_id,
      listing_id: item.listing_id,
      status: "pending" as const,
      delivery_method: deliveryMethod,
      total: lineSubtotal + platformFee(lineSubtotal),
      platform_fee: platformFee(lineSubtotal),
    };
  });

  const { data: created, error } = await admin
    .from("transactions")
    .insert(rows)
    .select("id");

  if (error?.code === "23505") {
    return { error: "Barang ini baru saja dibeli orang lain." };
  }
  if (error || !created?.length) return { error: "Gagal membuat transaksi." };

  const groupId = created[0].id;
  const { data: session } = await supabase.auth.getUser();

  let invoice;
  try {
    invoice = await createInvoice({
      transactionId: groupId,
      amount: subtotal + fee,
      buyerName: profile?.full_name ?? "Pembeli",
      buyerEmail: session.user?.email ?? "",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[paymenku] gagal membuat transaksi:", reason);

    await admin
      .from("transactions")
      .delete()
      .in("id", created.map((r) => r.id));

    return { error: `Gagal menghubungi Paymenku: ${reason.slice(0, 140)}` };
  }

  await admin
    .from("transactions")
    .update({
      paymenku_invoice_id: invoice.trx_id,
      paymenku_payment_url: invoice.pay_url,
    })
    .in("id", created.map((r) => r.id));

  if (!invoice.pay_url) {
    return { error: "Paymenku tidak mengembalikan link pembayaran." };
  }
  redirect(invoice.pay_url);
}

export async function createListing(input: {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  delivery?: string[];
  campus: string;
  images: string[];
}) {
  const user = await requireUser();

  if (!input.title.trim()) return { error: "Judul iklan wajib diisi." };
  if (!Number.isFinite(input.price) || input.price <= 0)
    return { error: "Harga harus lebih dari nol." };

  const delivery = input.delivery?.length ? input.delivery : ["cod", "kirim"];

  const { data, error } = await admin
    .from("listings")
    .insert({
      seller_id: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      price: Math.trunc(input.price),
      category: input.category,
      condition: input.condition,
      delivery,
      campus: input.campus || null,
      images: input.images,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Gagal memposting iklan." };

  revalidatePath("/");
  revalidatePath("/discover");
  return { id: data.id as string };
}

export async function uploadListingImage(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "File tidak valid." };
  if (file.size > 5 * 1024 * 1024) return { error: "Ukuran maksimal 5MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage
    .from("listing-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: "Gagal mengunggah foto." };

  const { data } = admin.storage.from("listing-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function uploadAvatar(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "File tidak valid." };
  if (file.size > 5 * 1024 * 1024) return { error: "Ukuran maksimal 5MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) return { error: "Gagal mengunggah foto." };

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  await admin.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { url: data.publicUrl };
}

export async function sendMessage(input: {
  receiverId: string;
  listingId: string | null;
  content: string;
}) {
  const user = await requireUser();
  const content = input.content.trim();
  if (!content) return { error: "Pesan kosong." };

  const { error } = await admin.from("messages").insert({
    sender_id: user.id,
    receiver_id: input.receiverId,
    listing_id: input.listingId,
    content,
  });

  if (error) return { error: "Gagal mengirim pesan." };
  revalidatePath("/inbox");
  return { ok: true };
}

export async function markThreadRead(otherId: string, listingId: string | null) {
  const user = await requireUser();

  let query = admin
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", otherId)
    .eq("is_read", false);

  query = listingId ? query.eq("listing_id", listingId) : query.is("listing_id", null);
  await query;

  revalidatePath("/inbox");
  revalidatePath("/", "layout");
}

export async function markAllMessagesRead() {
  const user = await requireUser();
  await admin
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  revalidatePath("/notifications");
  revalidatePath("/inbox");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfile(input: {
  full_name: string;
  university: string;
  major: string;
}) {
  const user = await requireUser();

  await admin
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      university: input.university,
      major: input.major.trim(),
    })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateNotificationPrefs(prefs: Record<string, boolean>) {
  const user = await requireUser();
  await admin.from("profiles").update({ notification_prefs: prefs }).eq("id", user.id);
  revalidatePath("/settings");
  return { ok: true };
}

export async function changePassword(newPassword: string) {
  await requireUser();
  if (newPassword.length < 8)
    return { error: "Kata sandi minimal 8 karakter." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: "Gagal mengganti kata sandi." };
  return { ok: true };
}

export async function confirmReceived(transactionId: string) {
  const user = await requireUser();

  const { data: trx } = await admin
    .from("transactions")
    .select("id, buyer_id, seller_id, status")
    .eq("id", transactionId)
    .maybeSingle();

  if (
    !trx ||
    trx.buyer_id !== user.id ||
    !["diproses", "dikirim"].includes(trx.status as string)
  ) {
    return { error: "Transaksi tidak bisa dikonfirmasi." };
  }

  await admin.from("transactions").update({ status: "selesai" }).eq("id", transactionId);

  const { count } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", trx.seller_id)
    .eq("status", "selesai");

  await admin
    .from("profiles")
    .update({ total_sold: count ?? 0 })
    .eq("id", trx.seller_id);

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  return { ok: true };
}

export async function markShipped(transactionId: string) {
  const user = await requireUser();

  const { data: trx } = await admin
    .from("transactions")
    .select("id, seller_id, status")
    .eq("id", transactionId)
    .maybeSingle();

  if (!trx || trx.seller_id !== user.id || trx.status !== "diproses") {
    return { error: "Pesanan ini tidak bisa ditandai dikirim." };
  }

  await admin
    .from("transactions")
    .update({ status: "dikirim", shipped_at: new Date().toISOString() })
    .eq("id", transactionId)
    .eq("status", "diproses");

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  return { ok: true };
}

export async function cancelOrder(transactionId: string) {
  const user = await requireUser();

  const { data: trx } = await admin
    .from("transactions")
    .select("id, buyer_id, seller_id, listing_id, status")
    .eq("id", transactionId)
    .maybeSingle();

  const isParty = trx && (trx.seller_id === user.id || trx.buyer_id === user.id);
  if (!trx || !isParty || !["pending", "diproses"].includes(trx.status as string)) {
    return { error: "Pesanan ini tidak bisa dibatalkan." };
  }

  await admin
    .from("transactions")
    .update({ status: "dibatalkan" })
    .eq("id", transactionId)
    .in("status", ["pending", "diproses"]);

  await admin
    .from("listings")
    .update({ is_active: true })
    .eq("id", trx.listing_id as string);

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}`);
  return { ok: true };
}

export async function submitReview(input: {
  transactionId: string;
  rating: number;
  comment: string;
}) {
  const user = await requireUser();

  const { data: trx } = await admin
    .from("transactions")
    .select("id, buyer_id, seller_id, status")
    .eq("id", input.transactionId)
    .maybeSingle();

  if (!trx || trx.buyer_id !== user.id || trx.status !== "selesai")
    return { error: "Transaksi belum bisa diulas." };

  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("transaction_id", input.transactionId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (existing) return { error: "Kamu sudah memberi ulasan." };

  await admin.from("reviews").insert({
    transaction_id: input.transactionId,
    reviewer_id: user.id,
    reviewed_id: trx.seller_id,
    rating: Math.max(1, Math.min(5, Math.trunc(input.rating))),
    comment: input.comment.trim() || null,
  });

  const { data: all } = await admin
    .from("reviews")
    .select("rating")
    .eq("reviewed_id", trx.seller_id);

  const ratings = (all ?? []).map((r) => r.rating as number);
  const avg = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;

  await admin.from("profiles").update({ rating: avg }).eq("id", trx.seller_id);

  revalidatePath("/transactions");
  revalidatePath(`/profile/${trx.seller_id}`);
  return { ok: true };
}

export async function requestWithdrawal(input: {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  const user = await requireUser();

  const amount = Math.trunc(input.amount);
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
    return { error: `Minimal pencairan ${formatRupiah(MIN_WITHDRAWAL)}.` };
  }
  if (!input.bankName.trim() || !input.accountNumber.trim() || !input.accountName.trim()) {
    return { error: "Data rekening wajib diisi lengkap." };
  }

  const { available } = await getSellerBalance(user.id);
  if (amount > available) {
    return { error: `Saldo tidak cukup. Tersedia ${formatRupiah(available)}.` };
  }

  const { error } = await admin.from("withdrawals").insert({
    seller_id: user.id,
    amount,
    bank_name: input.bankName.trim(),
    account_number: input.accountNumber.trim(),
    account_name: input.accountName.trim(),
  });

  if (error) return { error: "Gagal mengajukan pencairan." };

  revalidatePath("/settings");
  return { ok: true };
}

/** Admin only: mark a withdrawal as transferred or rejected. */
export async function resolveWithdrawal(
  withdrawalId: string,
  status: "selesai" | "ditolak",
  note?: string,
) {
  const user = await requireUser();

  const { data: me } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!me?.is_admin) return { error: "Butuh akses admin." };

  const { error } = await admin
    .from("withdrawals")
    .update({
      status,
      note: note?.trim() || null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId)
    .eq("status", "pending");

  if (error) return { error: "Gagal memperbarui pencairan." };

  revalidatePath("/admin/withdrawals");
  revalidatePath("/settings");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
