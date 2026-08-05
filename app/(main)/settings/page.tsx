import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CreditCard, Lock, LogOut, User } from "lucide-react";
import { Card } from "@/components/ui";
import { AccountForm } from "./account-form";
import { NotificationForm } from "./notification-form";
import { PasswordForm } from "./password-form";
import { PaymentInfo } from "./payment-info";
import { SignOutButton } from "./sign-out-button";
import { getSession } from "@/lib/data";

const SECTIONS = [
  { key: "akun", label: "Akun", icon: User },
  { key: "notifikasi", label: "Notifikasi", icon: Bell },
  { key: "pembayaran", label: "Metode Pembayaran", icon: CreditCard },
  { key: "sandi", label: "Ganti Kata Sandi", icon: Lock },
] as const;

const HEADINGS = {
  akun: { title: "Detail Akun", subtitle: "Perbarui informasi profilmu" },
  notifikasi: {
    title: "Preferensi Notifikasi",
    subtitle: "Atur kabar apa saja yang mau kamu terima",
  },
  pembayaran: {
    title: "Metode Pembayaran",
    subtitle: "Cara pembayaran yang tersedia di operek",
  },
  sandi: {
    title: "Ganti Kata Sandi",
    subtitle: "Gunakan kata sandi yang kuat dan unik",
  },
} as const;

export default async function SettingsPage(props: PageProps<"/settings">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings");

  const params = await props.searchParams;
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab = (SECTIONS.find((s) => s.key === raw)?.key ?? "akun") as keyof typeof HEADINGS;
  const heading = HEADINGS[tab];

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">Pengaturan</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              href={key === "akun" ? "/settings" : `/settings?tab=${key}`}
              className={`flex items-center gap-2.5 rounded-field px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <SignOutButton>
            <LogOut className="size-4" />
            Keluar
          </SignOutButton>
        </nav>

        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-bold text-ink-900">{heading.title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{heading.subtitle}</p>
          </div>

          <div className="p-6">
            {tab === "akun" && (
              <AccountForm
                profile={session.profile}
                email={session.user.email ?? ""}
              />
            )}
            {tab === "notifikasi" && (
              <NotificationForm
                prefs={
                  session.profile?.notification_prefs ?? {
                    messages: true,
                    listings: true,
                    sales: false,
                  }
                }
              />
            )}
            {tab === "pembayaran" && <PaymentInfo />}
            {tab === "sandi" && <PasswordForm />}
          </div>
        </Card>
      </div>
    </div>
  );
}
