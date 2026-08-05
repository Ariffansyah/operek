import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-ink-900">Lupa Kata Sandi</h1>
      <p className="mt-1 text-sm text-gray-500">
        Masukin emailmu, kami kirim link untuk atur ulang kata sandi.
      </p>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-sm text-gray-500">
        Ingat kata sandimu?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Masuk
        </Link>
      </p>
    </>
  );
}
