import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-ink-900">Daftar operek</h1>
      <p className="mt-1 text-sm text-gray-500">
        Terbuka buat mahasiswa aktif maupun alumni.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Masuk
        </Link>
      </p>
    </>
  );
}
