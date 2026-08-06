import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { applyPaymentStatus } from "@/lib/payments";

function signatureMatches(
  timestamp: string | null,
  rawBody: string,
  provided: string | null,
) {
  const secret = process.env.PAYMENKU_WEBHOOK_SECRET;
  if (!secret || !provided || !timestamp) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided.trim(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-paymenku-timestamp");
  const provided = request.headers.get("x-paymenku-signature");

  if (!signatureMatches(timestamp, rawBody, provided)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: {
    trx_id?: string;
    reference_id?: string;
    status?: string;
    paid_at?: string | null;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const result = await applyPaymentStatus({
    referenceId: payload.reference_id,
    trxId: payload.trx_id,
    status: payload.status,
    paidAt: payload.paid_at,
  });

  if (result.error === "missing reference") {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.error === "unknown transaction") {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ received: true });
}
