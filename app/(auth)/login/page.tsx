import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const next = (Array.isArray(params.next) ? params.next[0] : params.next) || "/";

  return (
    <>
      <h1 className="text-2xl font-bold text-ink-900">Masuk ke operek</h1>
      <p className="mt-1 text-sm text-gray-500">
        Lanjutin jual beli barang kampusmu.
      </p>

      <LoginForm next={next} />

      <p className="mt-6 text-center text-sm text-gray-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </>
  );
}
