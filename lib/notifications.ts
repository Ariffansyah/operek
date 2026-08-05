import "server-only";
import { admin } from "@/lib/supabase/admin";

export type Feed = {
  id: string;
  kind: "message" | "sold" | "saved" | "paid";
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  href: string;
};

const DEFAULT_PREFS = {
  messages: true,
  listings: true,
  sales: false,
};

type Prefs = typeof DEFAULT_PREFS;

const PREF_FOR_KIND: Record<Feed["kind"], keyof Prefs> = {
  message: "messages",
  saved: "listings",
  sold: "sales",
  paid: "sales",
};

async function getPrefs(userId: string): Promise<Prefs> {
  const { data } = await admin
    .from("profiles")
    .select("notification_prefs")
    .eq("id", userId)
    .maybeSingle();

  return { ...DEFAULT_PREFS, ...(data?.notification_prefs ?? {}) };
}

export async function getUnreadNotificationCount(userId: string) {
  const prefs = await getPrefs(userId);

  const [messages, sales] = await Promise.all([
    prefs.messages
      ? admin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("is_read", false)
      : Promise.resolve({ count: 0 }),
    prefs.sales
      ? admin
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", userId)
          .eq("status", "diproses")
      : Promise.resolve({ count: 0 }),
  ]);

  return (messages.count ?? 0) + (sales.count ?? 0);
}

export async function getNotificationFeed(userId: string): Promise<Feed[]> {
  const prefs = await getPrefs(userId);

  const [messages, sales, purchases, saves] = await Promise.all([
    admin
      .from("messages")
      .select("id, content, created_at, is_read, sender_id, listing_id")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("transactions")
      .select("id, created_at, status, paid_at, listing:listings(title), buyer:profiles!transactions_buyer_id_fkey(full_name)")
      .eq("seller_id", userId)
      .in("status", ["diproses", "selesai"])
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("transactions")
      .select("id, created_at, paid_at, total, listing:listings(title)")
      .eq("buyer_id", userId)
      .not("paid_at", "is", null)
      .order("paid_at", { ascending: false })
      .limit(20),
    admin
      .from("saved_listings")
      .select("listing_id, listings!inner(id, title, seller_id)")
      .eq("listings.seller_id", userId)
      .limit(20),
  ]);

  const senderIds = [
    ...new Set((messages.data ?? []).map((m) => m.sender_id as string)),
  ];
  const { data: senders } = senderIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", senderIds)
    : { data: [] };
  const nameById = new Map(
    (senders ?? []).map((p) => [p.id as string, p.full_name as string]),
  );

  const feed: Feed[] = [];

  for (const m of messages.data ?? []) {
    feed.push({
      id: `msg-${m.id}`,
      kind: "message",
      title: `Pesan baru dari ${nameById.get(m.sender_id as string) ?? "pengguna"}`,
      body: m.content as string,
      createdAt: m.created_at as string,
      unread: !m.is_read,
      href: `/inbox?to=${m.sender_id}${m.listing_id ? `&listing=${m.listing_id}` : ""}`,
    });
  }

  for (const t of sales.data ?? []) {
    const listing = t.listing as unknown as { title: string } | null;
    const buyer = t.buyer as unknown as { full_name: string } | null;
    feed.push({
      id: `sale-${t.id}`,
      kind: "sold",
      title: "Barang kamu terjual!",
      body: `${listing?.title ?? "Barangmu"} dibeli oleh ${buyer?.full_name ?? "pembeli"}.`,
      createdAt: (t.paid_at as string) ?? (t.created_at as string),
      unread: t.status === "diproses",
      href: "/transactions?tab=penjualan",
    });
  }

  for (const t of purchases.data ?? []) {
    const listing = t.listing as unknown as { title: string } | null;
    feed.push({
      id: `paid-${t.id}`,
      kind: "paid",
      title: "Pembayaran dikonfirmasi",
      body: `Pembayaran untuk ${listing?.title ?? "pesananmu"} berhasil.`,
      createdAt: t.paid_at as string,
      unread: false,
      href: "/transactions?tab=pembelian",
    });
  }

  const savesByListing = new Map<string, { title: string; count: number }>();
  for (const s of saves.data ?? []) {
    const listing = s.listings as unknown as { id: string; title: string };
    const entry = savesByListing.get(listing.id);
    if (entry) entry.count += 1;
    else savesByListing.set(listing.id, { title: listing.title, count: 1 });
  }
  for (const [listingId, { title, count }] of savesByListing) {
    feed.push({
      id: `saved-${listingId}`,
      kind: "saved",
      title: "Iklanmu disimpan",
      body: `${count} orang menyimpan ${title}.`,
      createdAt: new Date(0).toISOString(),
      unread: false,
      href: `/product/${listingId}`,
    });
  }

  return feed
    .filter((item) => prefs[PREF_FOR_KIND[item.kind]])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
