"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/actions";

export function SignOutButton({ children }: { children: React.ReactNode }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void signOut())}
      className="flex w-full items-center gap-2.5 rounded-field px-3.5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:text-gray-400"
    >
      {children}
    </button>
  );
}
