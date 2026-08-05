"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { updateNotificationPrefs } from "@/lib/actions";

const OPTIONS = [
  { key: "messages", label: "Pesan baru", hint: "Waktu ada yang chat kamu" },
  { key: "listings", label: "Update iklan", hint: "Waktu ada yang menyimpan iklanmu" },
  { key: "sales", label: "Penjualan", hint: "Barangmu laku atau pembayaran masuk" },
] as const;

type Prefs = Record<string, boolean>;

export function NotificationForm({ prefs }: { prefs: Prefs }) {
  const [values, setValues] = useState<Prefs>(prefs);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        startSaving(async () => {
          const result = await updateNotificationPrefs(values);
          setMessage(result?.ok ? "Preferensi tersimpan." : "Gagal menyimpan.");
        });
      }}
    >
      <div className="divide-y divide-gray-100">
        {OPTIONS.map(({ key, label, hint }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-4 py-3.5 first:pt-0"
          >
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink-900">{label}</span>
              <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(values[key])}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: e.target.checked }))
              }
              className="size-5 shrink-0 rounded accent-brand-500"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" pill disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Simpan Perubahan
        </Button>
        {message && (
          <p aria-live="polite" className="text-sm text-gray-500">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
