"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllMessagesRead } from "@/lib/actions";

export function MarkAllRead() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllMessagesRead();
          router.refresh();
        })
      }
      className="text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:text-gray-400"
    >
      Tandai semua dibaca
    </button>
  );
}
