import "server-only";

const API = "https://api.paymenku.com/v1/invoices";

export type PaymenkuInvoice = {
  id?: string;
  invoice_url?: string;
  payment_url?: string;
  [k: string]: unknown;
};

export async function createInvoice({
  transactionId,
  amount,
  buyerName,
  buyerEmail,
  description,
}: {
  transactionId: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  description: string;
}): Promise<PaymenkuInvoice> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYMENKU_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: transactionId,
      amount,
      currency: "IDR",
      payment_method: "QRIS",
      description,
      customer: { name: buyerName, email: buyerEmail },
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?trx=${transactionId}`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?trx=${transactionId}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paymenku ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
