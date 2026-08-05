"use client";

import { useState, useTransition } from "react";
import { Check, Heart, Loader2 } from "lucide-react";
import { addToCart, toggleSaved } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function AddToCartButton({ listingId }: { listingId: string }) {
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      type="button"
      disabled={pending || added}
      title={error ?? undefined}
      onClick={() =>
        start(async () => {
          const result = await addToCart(listingId);
          if (result?.error) setError(result.error);
          else setAdded(true);
        })
      }
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-white transition-colors",
        error ? "bg-gray-300" : added ? "bg-brand-700" : "bg-brand-500 hover:bg-brand-600",
      )}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {added && !pending && <Check className="size-3.5" />}
      {error ? "Gagal" : added ? "Ditambah" : "Tambah"}
    </button>
  );
}

export function SaveButton({
  listingId,
  saved: initial,
}: {
  listingId: string;
  saved: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Hapus dari simpanan" : "Simpan iklan"}
      aria-pressed={saved}
      onClick={() =>
        start(async () => {
          setSaved((s) => !s);
          const result = await toggleSaved(listingId);
          if (typeof result?.saved === "boolean") setSaved(result.saved);
        })
      }
      className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
    >
      <Heart
        className={cn(
          "size-4",
          saved ? "fill-pink-500 text-pink-500" : "text-gray-500",
        )}
      />
    </button>
  );
}
