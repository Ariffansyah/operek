import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Handshake,
  Receipt,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge, Card, ConditionBadge, EmptyState } from "@/components/ui";
import { TransactionActions } from "./transaction-actions";
import { getSession, getTransactions } from "@/lib/data";
import { formatRupiah, TRANSACTION_STATUS_STYLE } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const TABS = [
  { key: "semua", label: "Semua" },
  { key: "pembelian", label: "Pembelian" },
  { key: "penjualan", label: "Penjualan" },
] as const;

const STATUS_ICON = {
  pending: Clock,
  diproses: Clock,
  selesai: CheckCircle2,
  dibatalkan: XCircle,
} as const;

const STATUS_LABEL = {
  pending: "Menunggu bayar",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
} as const;

function reference(t: Transaction) {
  const year = new Date(t.created_at).getFullYear();
  return `TRX-${year}-${t.id.slice(0, 6).toUpperCase()}`;
}

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/transactions");

  const params = await props.searchParams;
  const tab = (Array.isArray(params.tab) ? params.tab[0] : params.tab) || "semua";
  const transactions = await getTransactions(session.user.id, tab);

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
        <Receipt className="size-5 text-brand-500" />
        <h1 className="text-xl font-bold text-ink-900">Riwayat Transaksi</h1>
      </div>

      <div className="border-b border-gray-100 bg-white">
        <nav className="mx-auto flex max-w-[640px] gap-6 px-4">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={key === "semua" ? "/transactions" : `/transactions?tab=${key}`}
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                tab === key
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-ink-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-[640px] px-4 py-8">
        {transactions.length ? (
          <ul className="space-y-4">
            {transactions.map((t) => {
              const isBuyer = t.buyer_id === session.user.id;
              const StatusIcon = STATUS_ICON[t.status];
              const counterpart = isBuyer ? t.seller : t.buyer;

              return (
                <li key={t.id}>
                  <Card className="overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                      <span className="text-xs text-gray-400">{reference(t)}</span>
                      <Badge
                        className={
                          isBuyer
                            ? "bg-blue-50 text-blue-600"
                            : "bg-accent-50 text-accent-600"
                        }
                      >
                        {isBuyer ? "Pembelian" : "Penjualan"}
                      </Badge>
                      <div className="flex-1" />
                      <Badge className={TRANSACTION_STATUS_STYLE[t.status]}>
                        <StatusIcon className="size-3" />
                        {STATUS_LABEL[t.status]}
                      </Badge>
                    </div>

                    <div className="flex gap-4 p-4">
                      <Link
                        href={`/product/${t.listing_id}`}
                        className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                      >
                        {t.listing?.images?.[0] && (
                          <Image
                            src={t.listing.images[0]}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${t.listing_id}`}
                          className="line-clamp-1 text-sm font-semibold text-ink-900 hover:text-brand-700"
                        >
                          {t.listing?.title ?? "Barang"}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {isBuyer ? "Dari" : "Ke"}:{" "}
                          {counterpart?.full_name ?? "Pengguna"} ·{" "}
                          {new Date(t.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {t.listing?.condition && (
                            <ConditionBadge condition={t.listing.condition} />
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            {t.delivery_method === "kirim" ? (
                              <>
                                <Truck className="size-3" />
                                Pengiriman Mandiri
                              </>
                            ) : (
                              <>
                                <Handshake className="size-3" />
                                Ketemuan
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-ink-900">
                          {formatRupiah(t.total)}
                        </p>
                        <TransactionActions
                          transactionId={t.id}
                          status={t.status}
                          isBuyer={isBuyer}
                          paymentUrl={t.paymenku_payment_url}
                        />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title="Belum ada transaksi"
            description="Transaksi pembelian dan penjualanmu bakal tercatat di sini."
          />
        )}
      </div>
    </div>
  );
}
