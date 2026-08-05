import { QrCode, Shield } from "lucide-react";

export function PaymentInfo() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 rounded-field border border-gray-200 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <QrCode className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">QRIS via Paymenku</p>
          <p className="mt-0.5 text-sm text-gray-500">
            Scan pakai aplikasi bank atau e-wallet apa pun. Ini satu-satunya metode
            pembayaran di operek, jadi nggak ada kartu yang perlu kamu simpan di sini.
          </p>
        </div>
      </div>

      <p className="flex gap-2 rounded-field bg-gray-50 p-3.5 text-xs leading-5 text-gray-600">
        <Shield className="mt-0.5 size-4 shrink-0" />
        Pembayaran diproses langsung oleh Paymenku. operek tidak pernah menyimpan
        data kartu atau rekeningmu.
      </p>
    </div>
  );
}
