import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/layout/header";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 px-4 py-24 text-center">
      <Logo className="mb-4" />
      <p className="text-5xl font-extrabold text-brand-500">404</p>
      <h1 className="text-lg font-bold text-ink-900">Halaman nggak ketemu</h1>
      <p className="max-w-sm text-sm text-gray-500">
        Mungkin iklannya sudah dihapus atau linknya salah.
      </p>
      <ButtonLink href="/" pill className="mt-2">
        Balik ke Beranda
      </ButtonLink>
    </div>
  );
}
