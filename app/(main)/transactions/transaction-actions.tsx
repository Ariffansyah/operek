"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import {
  cancelOrder,
  confirmReceived,
  markShipped,
  submitReview,
} from "@/lib/actions";
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

  const run = (fn: () => Promise<{ error?: string } | void>) =>
    start(async () => {
      const result = await fn();
      setMessage(result && "error" in result ? (result.error ?? null) : null);
      router.refresh();
    });

  if (!isBuyer) {
    return (
      <div className="mt-1 flex flex-col items-end gap-1">
        {status === "diproses" && (
          <>
            <ActionButton
              pending={pending}
              onClick={() => run(() => markShipped(transactionId))}
            >
              Tandai Dikirim
            </ActionButton>
            <ActionButton
              tone="muted"
              pending={pending}
              onClick={() => run(() => cancelOrder(transactionId))}
            >
              Batalkan
            </ActionButton>
          </>
        )}
        {status === "dikirim" && (
          <span className="text-xs text-gray-500">Menunggu konfirmasi pembeli</span>
        )}
        {status === "pending" && (
          <span className="text-xs text-gray-500">Menunggu pembayaran</span>
        )}
        <Note message={message} />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mt-1 flex flex-col items-end gap-1">
        {paymentUrl && (
          <a
            href={paymentUrl}
            className="text-xs font-semibold text-accent-600 hover:underline"
          >
            Bayar sekarang
          </a>
        )}
        <ActionButton
          tone="muted"
          pending={pending}
          onClick={() => run(() => cancelOrder(transactionId))}
        >
          Batalkan
        </ActionButton>
        <Note message={message} />
      </div>
    );
  }

  if (status === "diproses" || status === "dikirim") {
    return (
      <div className="mt-1 flex flex-col items-end gap-1">
        <ActionButton
          pending={pending}
          onClick={() => run(() => confirmReceived(transactionId))}
        >
          Konfirmasi terima
        </ActionButton>
        <Note message={message} />
      </div>
    );
  }

  if (status === "selesai") {
    if (!reviewing) {
      return (
        <div className="mt-1 flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Beri ulasan
          </button>
          <Note message={message} />
        </div>
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
            onClick={() => {
              setReviewing(false);
              run(() => submitReview({ transactionId, rating, comment }));
            }}
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            Kirim
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReviewing(false)}>
            Batal
          </Button>
        </div>
        <Note message={message} />
      </div>
    );
  }

  return null;
}

function ActionButton({
  children,
  onClick,
  pending,
  tone = "brand",
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending: boolean;
  tone?: "brand" | "muted";
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={cn(
        "text-xs font-semibold hover:underline disabled:text-gray-400",
        tone === "brand" ? "text-accent-600" : "text-gray-500",
      )}
    >
      {pending ? "Menyimpan..." : children}
    </button>
  );
}

function Note({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p aria-live="polite" className="max-w-[10rem] text-right text-xs text-red-600">
      {message}
    </p>
  );
}
