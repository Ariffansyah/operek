import { redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/layout/header";
import { getTransaction } from "@/lib/data";
import { syncTransaction } from "@/lib/payments";
import { formatRupiah } from "@/lib/utils";

export default async function PaymentSuccessPage(
  props: PageProps<"/payment/success">,
) {
  const params = await props.searchParams;
  const trx = Array.isArray(params.trx) ? params.trx[0] : params.trx;

  if (trx) await syncTransaction(trx);

  const transaction = trx ? await getTransaction(trx) : null;

  if (transaction?.status === "dibatalkan") redirect("/payment/failed");

  const pending = transaction?.status === "pending";

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <Logo className="mb-8" />

      {pending ? (
        <span className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="size-8" />
        </span>
      ) : (
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-8" />
        </span>
      )}

      <h1 className="mt-6 text-2xl font-bold text-ink-900">
        {pending ? "Menunggu Konfirmasi" : "Pembayaran Berhasil"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {pending
          ? "Pembayaranmu belum terkonfirmasi. Kalau kamu sudah bayar, statusnya akan berubah sendiri dalam beberapa saat."
          : "Pesananmu sudah diteruskan ke penjual. Cek halaman transaksi untuk lihat statusnya, atau chat penjual buat atur ketemuan."}
      </p>

      {transaction && (
        <p className="mt-4 text-sm font-semibold text-ink-900">
          Total: {formatRupiah(transaction.total)}
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
