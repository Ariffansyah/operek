"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Receipt, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Beranda", icon: Home, badge: false },
  { href: "/discover", label: "Temukan", icon: Compass, badge: false },
  { href: "/cart", label: "Keranjang", icon: ShoppingCart, badge: true },
  { href: "/transactions", label: "Transaksi", icon: Receipt, badge: false },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({
  cartCount,
  className,
}: {
  cartCount: number;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("items-center justify-center gap-1", className)}>
      {LINKS.map(({ href, label, badge }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            isActive(pathname, href)
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-50",
          )}
        >
          {label}
          {badge && cartCount > 0 && (
            <span className="absolute -top-0.5 right-1 flex size-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-gray-100 bg-white md:hidden">
      {LINKS.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
              active ? "text-brand-700" : "text-gray-500",
            )}
          >
            <Icon className="size-5" />
            {label}
            {badge && cartCount > 0 && (
              <span className="absolute right-[22%] top-1.5 flex size-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
