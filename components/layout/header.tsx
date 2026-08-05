import Image from "next/image";
import Link from "next/link";
import { Bell, MessageSquare, Plus, Settings } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { NavLinks } from "./nav-links";
import type { Profile } from "@/lib/types";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/logo.png"
        alt=""
        width={28}
        height={28}
        style={{ mixBlendMode: "multiply" }}
        priority
      />
      <span className="text-lg font-extrabold tracking-tight text-ink-900">
        ope<span className="text-brand-500">rek</span>
      </span>
    </Link>
  );
}

export function Header({
  profile,
  cartCount,
  unreadMessages,
}: {
  profile: Profile | null;
  cartCount: number;
  unreadMessages: number;
}) {
  const firstName = profile?.full_name?.split(" ")[0] ?? "Akun";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        <Logo />

        <NavLinks cartCount={cartCount} className="hidden flex-1 md:flex" />
        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1">
          <IconLink
            href="/inbox"
            label="Pesan"
            dot={unreadMessages > 0}
            className="hidden sm:inline-flex"
          >
            <MessageSquare className="size-5" />
          </IconLink>
          <IconLink
            href="/notifications"
            label="Notifikasi"
            dot
            className="hidden sm:inline-flex"
          >
            <Bell className="size-5" />
          </IconLink>
          <IconLink href="/settings" label="Pengaturan" className="hidden sm:inline-flex">
            <Settings className="size-5" />
          </IconLink>

          {profile ? (
            <Link
              href={`/profile/${profile.id}`}
              className="ml-1 flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              <Avatar profile={profile} size={26} />
              <span className="hidden lg:inline">{firstName}</span>
            </Link>
          ) : (
            <ButtonLink href="/login" variant="outline" size="sm" pill className="ml-1">
              Masuk
            </ButtonLink>
          )}

          <ButtonLink href="/sell" variant="accent" size="sm" pill className="ml-1 h-9 px-4">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Jual</span>
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

function IconLink({
  href,
  label,
  dot,
  className,
  children,
}: {
  href: string;
  label: string;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative rounded-full p-2 text-gray-600 hover:bg-gray-100 ${className ?? ""}`}
    >
      {children}
      {dot && (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent-500" />
      )}
    </Link>
  );
}

export function Avatar({
  profile,
  size = 40,
  className,
}: {
  profile: Pick<Profile, "full_name" | "avatar_url"> | null;
  size?: number;
  className?: string;
}) {
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "?";

  if (profile?.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-700 ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
