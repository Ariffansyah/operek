import "server-only";
import { admin } from "@/lib/supabase/admin";
import { checkStatus } from "@/lib/paymenku";

const CANCELLING = new Set(["failed", "expired", "cancelled", "refunded"]);

export async function applyPaymentStatus({
  referenceId,
  trxId,
  status,
  paidAt,
}: {
  referenceId?: string | null;
  trxId?: string | null;
  status?: string | null;
  paidAt?: string | null;
}) {
  if (!referenceId && !trxId) return { error: "missing reference" };

  const filters = [
    referenceId ? `id.eq.${referenceId}` : null,
    trxId ? `paymenku_invoice_id.eq.${trxId}` : null,
  ].filter(Boolean) as string[];

  const { data: rows } = await admin
    .from("transactions")
    .select("id, buyer_id, listing_id")
    .or(filters.join(","));

  if (!rows?.length) return { error: "unknown transaction" };

  const ids = rows.map((r) => r.id as string);

  if (status === "paid") {
    await admin
      .from("transactions")
      .update({ status: "diproses", paid_at: paidAt ?? new Date().toISOString() })
      .in("id", ids)
      .eq("status", "pending");

    const listingIds = rows.map((r) => r.listing_id as string);
    const buyerIds = [...new Set(rows.map((r) => r.buyer_id as string))];

    await admin.from("listings").update({ is_active: false }).in("id", listingIds);
    await admin.from("cart_items").delete().in("user_id", buyerIds);
  } else if (status && CANCELLING.has(status)) {
    await admin
      .from("transactions")
      .update({ status: "dibatalkan" })
      .in("id", ids)
      .eq("status", "pending");
  }

  return { ok: true };
}

/**
 * Fallback for when a webhook never arrives: ask Paymenku what actually
 * happened and apply it. Safe to call repeatedly.
 */
export async function syncTransaction(transactionId: string) {
  const { data: trx } = await admin
    .from("transactions")
    .select("id, status, paymenku_invoice_id")
    .eq("id", transactionId)
    .maybeSingle();

  if (!trx || trx.status !== "pending") return { synced: false };

  try {
    const remote = await checkStatus(
      (trx.paymenku_invoice_id as string) ?? transactionId,
    );
    await applyPaymentStatus({
      referenceId: remote.reference_id,
      trxId: remote.trx_id,
      status: remote.status,
      paidAt: remote.paid_at,
    });
    return { synced: true, status: remote.status };
  } catch (err) {
    console.error("[paymenku] sync gagal:", err);
    return { synced: false };
  }
}
