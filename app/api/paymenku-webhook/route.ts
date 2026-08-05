import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { admin } from "@/lib/supabase/admin";

function signatureMatches(rawBody: string, provided: string | null) {
  const secret = process.env.PAYMENKU_WEBHOOK_SECRET;
  if (!secret || !provided) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided.replace(/^sha256=/, "").trim(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const provided =
    request.headers.get("x-paymenku-signature") ??
    request.headers.get("x-signature");

  if (!signatureMatches(rawBody, provided)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: { event?: string; data?: { external_id?: string; id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const externalId = payload.data?.external_id;
  if (!externalId) {
    return NextResponse.json({ error: "missing external_id" }, { status: 400 });
  }

  const { data: rows } = await admin
    .from("transactions")
    .select("id, buyer_id, listing_id")
    .or(`id.eq.${externalId},paymenku_invoice_id.eq.${payload.data?.id ?? externalId}`);

  if (!rows?.length) {
    return NextResponse.json({ error: "unknown transaction" }, { status: 404 });
  }

  const ids = rows.map((r) => r.id as string);

  if (payload.event === "PAYMENT_SUCCEEDED") {
    await admin
      .from("transactions")
      .update({ status: "diproses", paid_at: new Date().toISOString() })
      .in("id", ids)
      .eq("status", "pending");

    const listingIds = rows.map((r) => r.listing_id as string);
    const buyerIds = [...new Set(rows.map((r) => r.buyer_id as string))];

    await admin.from("listings").update({ is_active: false }).in("id", listingIds);
    await admin.from("cart_items").delete().in("user_id", buyerIds);
  } else if (payload.event === "PAYMENT_FAILED") {
    await admin
      .from("transactions")
      .update({ status: "dibatalkan" })
      .in("id", ids)
      .eq("status", "pending");
  }

  return NextResponse.json({ received: true });
}
