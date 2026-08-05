import { XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/layout/header";

export default function PaymentFailedPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <Logo className="mb-8" />

      <span className="flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <XCircle className="size-8" />
      </span>

      <h1 className="mt-6 text-2xl font-bold text-ink-900">Pembayaran Gagal</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Pembayaranmu nggak selesai, jadi transaksinya kami batalkan. Barangnya masih
        ada di keranjang, tinggal coba bayar lagi.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/cart" pill>
          Kembali ke Keranjang
        </ButtonLink>
        <ButtonLink href="/transactions" variant="outline" pill>
          Lihat Transaksi
        </ButtonLink>
      </div>
    </div>
  );
}
