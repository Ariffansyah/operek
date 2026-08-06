import { notFound, redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/layout/header";
import { ResolveButtons } from "./resolve-buttons";
import { getPendingWithdrawals, getSession } from "@/lib/data";
import {
  formatRupiah,
  WITHDRAWAL_STATUS_LABEL,
  WITHDRAWAL_STATUS_STYLE,
} from "@/lib/utils";

export default async function AdminWithdrawalsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/withdrawals");
  if (!session.profile?.is_admin) notFound();

  const withdrawals = await getPendingWithdrawals();
  const pending = withdrawals.filter((w) => w.status === "pending");
  const resolved = withdrawals.filter((w) => w.status !== "pending");

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <Wallet className="size-5 text-brand-500" />
        <h1 className="text-2xl font-bold text-ink-900">Pencairan Dana</h1>
        {pending.length > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
            {pending.length}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Transfer manual ke rekening penjual, lalu tandai di sini.
      </p>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-bold text-ink-900">Menunggu diproses</h2>
          {pending.length ? (
            <ul className="space-y-3">
              {pending.map((w) => (
                <li key={w.id}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <Avatar profile={w.seller ?? null} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">
                          {w.seller?.full_name ?? "Penjual"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(w.requested_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <p className="text-lg font-extrabold text-ink-900">
                        {formatRupiah(w.amount)}
                      </p>
                    </div>

                    <dl className="mt-3 grid gap-1 rounded-field bg-gray-50 p-3 text-sm sm:grid-cols-3">
                      <Detail label="Bank" value={w.bank_name} />
                      <Detail label="Nomor" value={w.account_number} />
                      <Detail label="Atas nama" value={w.account_name} />
                    </dl>

                    <ResolveButtons withdrawalId={w.id} />
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="Tidak ada pengajuan"
              description="Semua pencairan sudah diproses."
            />
          )}
        </section>

        {resolved.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold text-ink-900">Riwayat</h2>
            <ul className="divide-y divide-gray-100">
              {resolved.map((w) => (
                <li key={w.id} className="flex items-center gap-3 py-3">
                  <Avatar profile={w.seller ?? null} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {w.seller?.full_name ?? "Penjual"} · {formatRupiah(w.amount)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {w.bank_name} · {w.account_number}
                      {w.note ? ` · ${w.note}` : ""}
                    </p>
                  </div>
                  <Badge className={WITHDRAWAL_STATUS_STYLE[w.status]}>
                    {WITHDRAWAL_STATUS_LABEL[w.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
