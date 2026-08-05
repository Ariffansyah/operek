"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui";
import { addToCart } from "@/lib/actions";

export function DetailActions({
  listingId,
  sellerId,
  isOwnListing,
  signedIn,
}: {
  listingId: string;
  sellerId: string;
  isOwnListing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (isOwnListing) {
    return (
      <p className="mt-8 rounded-field bg-gray-100 px-4 py-3 text-sm text-gray-600">
        Ini iklanmu sendiri.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (!signedIn) return router.push("/login?next=/product/" + listingId);
              const result = await addToCart(listingId);
              setMessage(result?.error ?? "Ditambahkan ke keranjang.");
            })
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          Tambah ke Keranjang
        </Button>

        <Button
          variant="outlineAccent"
          size="lg"
          onClick={() =>
            router.push(
              signedIn
                ? `/inbox?to=${sellerId}&listing=${listingId}`
                : `/login?next=/product/${listingId}`,
            )
          }
        >
          <MessageCircle className="size-4" />
          Chat Penjual
        </Button>
      </div>

      {message && (
        <p aria-live="polite" className="mt-3 text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}
