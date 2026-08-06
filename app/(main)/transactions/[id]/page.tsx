import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Handshake,
  MessageCircle,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge, ButtonLink, Card, ConditionBadge } from "@/components/ui";
import { Avatar } from "@/components/layout/header";
import { TransactionActions } from "../transaction-actions";
import { getSession, getTransaction } from "@/lib/data";
import { syncTransaction } from "@/lib/payments";
import {
  formatRupiah,
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_STATUS_STYLE,
} from "@/lib/utils";

const STEPS = [
  { key: "pending", label: "Menunggu bayar" },
  { key: "diproses", label: "Diproses penjual" },
  { key: "dikirim", label: "Dikirim / diserahkan" },
  { key: "selesai", label: "Selesai" },
] as const;

const STATUS_ICON = {
  pending: Clock,
  diproses: Clock,
  dikirim: Truck,
  selesai: CheckCircle2,
  dibatalkan: XCircle,
} as const;

export default async function TransactionDetailPage(
  props: PageProps<"/transactions/[id]">,
) {
  const { id } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/transactions/${id}`);

  await syncTransaction(id);

  const trx = await getTransaction(id);
  if (!trx) notFound();

  const isBuyer = trx.buyer_id === session.user.id;
  const isSeller = trx.seller_id === session.user.id;
  if (!isBuyer && !isSeller) notFound();

  const counterpart = isBuyer ? trx.seller : trx.buyer;
  const StatusIcon = STATUS_ICON[trx.status];
  const cancelled = trx.status === "dibatalkan";
  const currentStep = STEPS.findIndex((s) => s.key === trx.status);
  const subtotal = trx.total - trx.platform_fee;
  const reference = `TRX-${new Date(trx.created_at).getFullYear()}-${trx.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <Link
        href="/transactions"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" />
        Riwayat Transaksi
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
          <span className="font-mono text-xs text-gray-400">{reference}</span>
          <Badge
            className={
              isBuyer ? "bg-blue-50 text-blue-600" : "bg-accent-50 text-accent-600"
            }
          >
            {isBuyer ? "Pembelian" : "Penjualan"}
          </Badge>
          <div className="flex-1" />
          <Badge className={TRANSACTION_STATUS_STYLE[trx.status]}>
            <StatusIcon className="size-3" />
            {TRANSACTION_STATUS_LABEL[trx.status]}
          </Badge>
        </div>

        {cancelled ? (
          <p className="border-b border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-600">
            Transaksi ini dibatalkan.
          </p>
        ) : (
          <ol className="border-b border-gray-100 px-5 py-5">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white ${
                        done ? "bg-brand-500" : "bg-gray-200"
                      }`}
                    >
                      {done && <CheckCircle2 className="size-3.5" />}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`h-6 w-0.5 ${i < currentStep ? "bg-brand-500" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`-mt-0.5 text-sm ${
                      done ? "font-semibold text-ink-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex gap-4 border-b border-gray-100 p-5">
          <Link
            href={`/product/${trx.listing_id}`}
            className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-gray-100"
          >
            {trx.listing?.images?.[0] && (
              <Image
                src={trx.listing.images[0]}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/product/${trx.listing_id}`}
              className="font-semibold text-ink-900 hover:text-brand-700"
            >
              {trx.listing?.title ?? "Barang"}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trx.listing?.condition && (
                <ConditionBadge condition={trx.listing.condition} />
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {trx.delivery_method === "kirim" ? (
                  <>
                    <Truck className="size-3" />
                    Pengiriman Mandiri
                  </>
                ) : (
                  <>
                    <Handshake className="size-3" />
                    Ketemuan (COD)
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {counterpart && (
          <div className="flex items-center gap-3 border-b border-gray-100 p-5">
            <Avatar profile={counterpart} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">{isBuyer ? "Penjual" : "Pembeli"}</p>
              <p className="truncate font-semibold text-ink-900">
                {counterpart.full_name ?? "Pengguna"}
              </p>
            </div>
            <ButtonLink
              href={`/inbox?to=${counterpart.id}&listing=${trx.listing_id}`}
              variant="outline"
              size="sm"
              pill
            >
              <MessageCircle className="size-3.5" />
              Chat
            </ButtonLink>
          </div>
        )}

        <dl className="space-y-2.5 border-b border-gray-100 p-5 text-sm">
          <Row label="Harga barang" value={formatRupiah(subtotal)} />
          <Row label="Biaya platform (3%)" value={formatRupiah(trx.platform_fee)} />
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <dt className="font-bold text-ink-900">
              {isBuyer ? "Total dibayar" : "Kamu terima"}
            </dt>
            <dd className="text-lg font-extrabold text-ink-900">
              {formatRupiah(isBuyer ? trx.total : subtotal)}
            </dd>
          </div>
        </dl>

        <dl className="space-y-2.5 p-5 text-xs text-gray-500">
          <Row label="Dibuat" value={formatDate(trx.created_at)} />
          {trx.paid_at && <Row label="Dibayar" value={formatDate(trx.paid_at)} />}
          {trx.shipped_at && (
            <Row label="Dikirim" value={formatDate(trx.shipped_at)} />
          )}
          {trx.paymenku_invoice_id && (
            <Row label="ID Paymenku" value={trx.paymenku_invoice_id} />
          )}
        </dl>
      </Card>

      <div className="mt-5 flex justify-end">
        <TransactionActions
          transactionId={trx.id}
          status={trx.status}
          isBuyer={isBuyer}
          paymentUrl={trx.paymenku_payment_url}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
