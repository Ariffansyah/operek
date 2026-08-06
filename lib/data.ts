import "server-only";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import type {
  CartItem,
  Listing,
  Message,
  Profile,
  Transaction,
  Withdrawal,
} from "@/lib/types";

const SELLER_FIELDS =
  "id, full_name, avatar_url, rating, university, status";
const LISTING_WITH_SELLER = `*, seller:profiles!listings_seller_id_fkey(${SELLER_FIELDS})`;

export async function getProfile(id: string) {
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as Profile | null;
}

export async function getSession() {
  const user = await getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  return { user, profile };
}

export async function getListings(filters?: {
  q?: string;
  category?: string;
  conditions?: string[];
  campuses?: string[];
  min?: number;
  max?: number;
  sort?: string;
  limit?: number;
  sellerId?: string;
  active?: boolean;
}) {
  let query = admin
    .from("listings")
    .select(LISTING_WITH_SELLER)
    .eq("is_active", filters?.active ?? true);

  if (filters?.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.conditions?.length) query = query.in("condition", filters.conditions);
  if (filters?.campuses?.length) query = query.in("campus", filters.campuses);
  if (filters?.min != null) query = query.gte("price", filters.min);
  if (filters?.max != null) query = query.lte("price", filters.max);
  if (filters?.sellerId) query = query.eq("seller_id", filters.sellerId);

  if (filters?.sort === "termurah") query = query.order("price", { ascending: true });
  else if (filters?.sort === "termahal") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (filters?.limit) query = query.limit(filters.limit);

  const { data } = await query;
  return (data ?? []) as Listing[];
}

export async function getListing(id: string) {
  const { data } = await admin
    .from("listings")
    .select(LISTING_WITH_SELLER)
    .eq("id", id)
    .maybeSingle();
  return data as Listing | null;
}

export async function getCart(userId: string) {
  const { data } = await admin
    .from("cart_items")
    .select(`id, user_id, listing_id, quantity, listing:listings(${LISTING_WITH_SELLER})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as CartItem[];
}

export async function getCartCount(userId: string) {
  const { count } = await admin
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function getUnreadMessageCount(userId: string) {
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function getTransactions(userId: string, tab?: string) {
  let query = admin
    .from("transactions")
    .select(
      `*, listing:listings(*),
       buyer:profiles!transactions_buyer_id_fkey(id, full_name, avatar_url),
       seller:profiles!transactions_seller_id_fkey(id, full_name, avatar_url)`,
    )
    .order("created_at", { ascending: false });

  if (tab === "pembelian") query = query.eq("buyer_id", userId);
  else if (tab === "penjualan") query = query.eq("seller_id", userId);
  else query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  const { data } = await query;
  return (data ?? []) as Transaction[];
}

export async function getTransaction(id: string) {
  const { data } = await admin
    .from("transactions")
    .select(
      `*, listing:listings(*),
       buyer:profiles!transactions_buyer_id_fkey(${SELLER_FIELDS}),
       seller:profiles!transactions_seller_id_fkey(${SELLER_FIELDS})`,
    )
    .eq("id", id)
    .maybeSingle();
  return data as Transaction | null;
}

/**
 * Seller earnings are the item price only. The 3% platform fee stays with
 * operek, and money already requested for withdrawal is held back.
 */
export async function getSellerBalance(sellerId: string) {
  const [sales, withdrawals] = await Promise.all([
    admin
      .from("transactions")
      .select("total, platform_fee")
      .eq("seller_id", sellerId)
      .eq("status", "selesai"),
    admin
      .from("withdrawals")
      .select("amount, status")
      .eq("seller_id", sellerId)
      .in("status", ["pending", "selesai"]),
  ]);

  const earned = (sales.data ?? []).reduce(
    (sum: number, t: { total: number | null; platform_fee: number | null }) =>
      sum + ((t.total ?? 0) - (t.platform_fee ?? 0)),
    0,
  );

  const held = (withdrawals.data ?? []).reduce(
    (sum: number, w: { amount: number }) => sum + w.amount,
    0,
  );

  return { earned, held, available: Math.max(0, earned - held) };
}

export async function getWithdrawals(sellerId: string) {
  const { data } = await admin
    .from("withdrawals")
    .select("*")
    .eq("seller_id", sellerId)
    .order("requested_at", { ascending: false });
  return (data ?? []) as Withdrawal[];
}

export async function getPendingWithdrawals() {
  const { data } = await admin
    .from("withdrawals")
    .select(`*, seller:profiles!withdrawals_seller_id_fkey(${SELLER_FIELDS})`)
    .order("requested_at", { ascending: true });
  return (data ?? []) as Withdrawal[];
}

export async function getConversations(userId: string) {
  const { data } = await admin
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  const messages = (data ?? []) as Message[];
  const threads = new Map<
    string,
    { otherId: string; listingId: string | null; last: Message; unread: number }
  >();

  for (const m of messages) {
    const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const key = `${otherId}:${m.listing_id ?? ""}`;
    const existing = threads.get(key);
    const isUnread = m.receiver_id === userId && !m.is_read;
    if (!existing) {
      threads.set(key, {
        otherId,
        listingId: m.listing_id,
        last: m,
        unread: isUnread ? 1 : 0,
      });
    } else if (isUnread) {
      existing.unread += 1;
    }
  }

  const list = [...threads.values()];
  const otherIds = [...new Set(list.map((t) => t.otherId))];
  const listingIds = [...new Set(list.map((t) => t.listingId).filter(Boolean))] as string[];

  const [{ data: people }, { data: listings }] = await Promise.all([
    otherIds.length
      ? admin.from("profiles").select(SELLER_FIELDS).in("id", otherIds)
      : Promise.resolve({ data: [] as Profile[] }),
    listingIds.length
      ? admin.from("listings").select("id, title, images").in("id", listingIds)
      : Promise.resolve({ data: [] as Listing[] }),
  ]);

  const peopleById = new Map((people ?? []).map((p) => [p.id, p as Profile]));
  const listingById = new Map((listings ?? []).map((l) => [l.id, l as Listing]));

  return list.map((t) => ({
    ...t,
    other: peopleById.get(t.otherId) ?? null,
    listing: t.listingId ? (listingById.get(t.listingId) ?? null) : null,
  }));
}

export async function getThread(
  userId: string,
  otherId: string,
  listingId: string | null,
) {
  let query = admin
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true });

  query = listingId ? query.eq("listing_id", listingId) : query.is("listing_id", null);

  const { data } = await query;
  return (data ?? []) as Message[];
}

export async function getSavedIds(userId: string) {
  const { data } = await admin
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.listing_id as string));
}

export async function getSavedListings(userId: string) {
  const { data } = await admin
    .from("saved_listings")
    .select(`listing_id, listing:listings(${LISTING_WITH_SELLER})`)
    .eq("user_id", userId);

  return (data ?? [])
    .map((row) => row.listing as unknown as Listing | null)
    .filter((listing): listing is Listing => Boolean(listing))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getReviews(profileId: string) {
  const { data } = await admin
    .from("reviews")
    .select(`*, reviewer:profiles!reviews_reviewer_id_fkey(${SELLER_FIELDS})`)
    .eq("reviewed_id", profileId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProfileStats(profileId: string) {
  const [active, sold, earned] = await Promise.all([
    admin
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", profileId)
      .eq("is_active", true),
    admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", profileId)
      .eq("status", "selesai"),
    admin
      .from("transactions")
      .select("total")
      .eq("seller_id", profileId)
      .eq("status", "selesai"),
  ]);

  return {
    activeListings: active.count ?? 0,
    sold: sold.count ?? 0,
    revenue: (earned.data ?? []).reduce(
      (sum: number, t: { total: number | null }) => sum + (t.total ?? 0),
      0,
    ),
  };
}
