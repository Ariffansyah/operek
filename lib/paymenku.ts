import "server-only";

const BASE_URL = process.env.PAYMENKU_BASE_URL ?? "https://paymenku.com/api/v1";

export type PaymenkuTransaction = {
  trx_id: string;
  reference_id: string;
  amount: string;
  status: string;
  pay_url: string;
  payment_info?: {
    qr_url?: string;
    qr_string?: string;
    expiration_date?: string;
  };
};

export type PaymenkuStatus = {
  trx_id: string;
  reference_id: string;
  status: string;
  amount: string;
  paid_at: string | null;
};

export async function checkStatus(orderId: string): Promise<PaymenkuStatus> {
  const res = await fetch(`${BASE_URL}/check-status/${orderId}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYMENKU_SECRET_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const raw = await res.text();
  let body: { status?: string; message?: string; data?: PaymenkuStatus };

  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`HTTP ${res.status}: respons bukan JSON`);
  }

  if (!res.ok || body.status !== "success" || !body.data) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return body.data;
}

export async function createInvoice({
  transactionId,
  amount,
  buyerName,
  buyerEmail,
}: {
  transactionId: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  description?: string;
}): Promise<PaymenkuTransaction> {
  const res = await fetch(`${BASE_URL}/transaction/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYMENKU_SECRET_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Idempotency-Key": transactionId,
    },
    body: JSON.stringify({
      channel_code: "qris",
      amount,
      reference_id: transactionId,
      customer_name: buyerName,
      customer_email: buyerEmail,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?trx=${transactionId}`,
    }),
  });

  const raw = await res.text();
  let body: { status?: string; message?: string; data?: PaymenkuTransaction };

  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`HTTP ${res.status}: respons bukan JSON`);
  }

  if (!res.ok || body.status !== "success" || !body.data) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return body.data;
}
