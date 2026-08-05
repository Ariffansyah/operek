import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/layout/header";
import { getTransaction } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export default async function PaymentSuccessPage(
  props: PageProps<"/payment/success">,
) {
  const params = await props.searchParams;
  const trx = Array.isArray(params.trx) ? params.trx[0] : params.trx;
  const transaction = trx ? await getTransaction(trx) : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <Logo className="mb-8" />

      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="size-8" />
      </span>

      <h1 className="mt-6 text-2xl font-bold text-ink-900">Pembayaran Berhasil</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Pesananmu sudah diteruskan ke penjual. Cek halaman transaksi untuk lihat
        statusnya, atau chat penjual buat atur ketemuan.
      </p>

      {transaction && (
        <p className="mt-4 text-sm font-semibold text-ink-900">
          Total dibayar: {formatRupiah(transaction.total)}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/transactions" pill>
          Lihat Transaksi
        </ButtonLink>
        <ButtonLink href="/discover" variant="outline" pill>
          Belanja Lagi
        </ButtonLink>
      </div>
    </div>
  );
}
