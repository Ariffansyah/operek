"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { confirmReceived, submitReview } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function TransactionActions({
  transactionId,
  status,
  isBuyer,
  paymentUrl,
}: {
  transactionId: string;
  status: string;
  isBuyer: boolean;
  paymentUrl: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reviewing, setReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (status === "pending" && isBuyer && paymentUrl) {
    return (
      <a
        href={paymentUrl}
        className="mt-1 block text-xs font-semibold text-accent-600 hover:underline"
      >
        Bayar sekarang
      </a>
    );
  }

  if (status === "diproses" && isBuyer) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await confirmReceived(transactionId);
            setMessage(result?.error ?? null);
            router.refresh();
          })
        }
        className="mt-1 text-xs font-semibold text-accent-600 hover:underline disabled:text-gray-400"
      >
        {pending ? "Menyimpan..." : "Konfirmasi terima"}
      </button>
    );
  }

  if (status === "selesai" && isBuyer) {
    if (!reviewing) {
      return (
        <>
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="mt-1 text-xs font-semibold text-brand-600 hover:underline"
          >
            Beri ulasan
          </button>
          {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
        </>
      );
    }

    return (
      <div className="mt-2 w-56 space-y-2 text-left">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i} bintang`}
              onClick={() => setRating(i)}
            >
              <Star
                className={cn(
                  "size-4",
                  i <= rating ? "fill-accent-500 text-accent-500" : "text-gray-300",
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Gimana pengalamannya?"
          className="text-xs"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await submitReview({
                  transactionId,
                  rating,
                  comment,
                });
                if (result?.error) setMessage(result.error);
                setReviewing(false);
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            Kirim
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReviewing(false)}>
            Batal
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
