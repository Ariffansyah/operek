"use client";

import { useState, useTransition } from "react";
import { Loader2, Wallet } from "lucide-react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { requestWithdrawal } from "@/lib/actions";
import {
  formatRupiah,
  WITHDRAWAL_STATUS_LABEL,
  WITHDRAWAL_STATUS_STYLE,
} from "@/lib/utils";
import type { Withdrawal } from "@/lib/types";

export function WithdrawalForm({
  balance,
  history,
  minWithdrawal,
}: {
  balance: { earned: number; held: number; available: number };
  history: Withdrawal[];
  minWithdrawal: number;
}) {
  const last = history[0];
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(last?.bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState(last?.account_number ?? "");
  const [accountName, setAccountName] = useState(last?.account_name ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const canRequest = balance.available >= minWithdrawal;

  return (
    <div className="space-y-6">
      <div className="rounded-field bg-brand-50 p-5">
        <div className="flex items-center gap-2 text-brand-700">
          <Wallet className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Saldo bisa dicairkan
          </span>
        </div>
        <p className="mt-1 text-3xl font-extrabold text-ink-900">
          {formatRupiah(balance.available)}
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Total pendapatan {formatRupiah(balance.earned)}, sedang diproses atau sudah
          dicairkan {formatRupiah(balance.held)}. Saldo bertambah setelah pembeli
          menekan konfirmasi terima.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          startSaving(async () => {
            const result = await requestWithdrawal({
              amount: Number(amount),
              bankName,
              accountNumber,
              accountName,
            });
            if (result?.error) setMessage(result.error);
            else {
              setMessage("Pengajuan terkirim. Admin akan memprosesnya.");
              setAmount("");
            }
          });
        }}
      >
        <Field label="Jumlah Pencairan (Rp)" htmlFor="amount">
          <Input
            id="amount"
            type="number"
            min={minWithdrawal}
            max={balance.available}
            required
            disabled={!canRequest}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(minWithdrawal)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Minimal {formatRupiah(minWithdrawal)}
          </p>
        </Field>

        <Field label="Nama Bank" htmlFor="bankName">
          <Input
            id="bankName"
            required
            disabled={!canRequest}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Cth: BCA"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nomor Rekening" htmlFor="accountNumber">
            <Input
              id="accountNumber"
              required
              disabled={!canRequest}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </Field>
          <Field label="Nama Pemilik Rekening" htmlFor="accountName">
            <Input
              id="accountName"
              required
              disabled={!canRequest}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" pill disabled={saving || !canRequest}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Ajukan Pencairan
          </Button>
          {message && (
            <p aria-live="polite" className="text-sm text-gray-500">
              {message}
            </p>
          )}
        </div>

        {!canRequest && (
          <p className="text-sm text-gray-500">
            Saldomu belum mencapai minimal pencairan.
          </p>
        )}
      </form>

      {history.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-ink-900">Riwayat Pencairan</h3>
          <ul className="divide-y divide-gray-100">
            {history.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {formatRupiah(w.amount)}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {w.bank_name} · {w.account_number} ·{" "}
                    {new Date(w.requested_at).toLocaleDateString("id-ID")}
                  </p>
                  {w.note && (
                    <p className="mt-0.5 text-xs text-gray-500">Catatan: {w.note}</p>
                  )}
                </div>
                <Badge className={WITHDRAWAL_STATUS_STYLE[w.status]}>
                  {WITHDRAWAL_STATUS_LABEL[w.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
