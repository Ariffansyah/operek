"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { resolveWithdrawal } from "@/lib/actions";

export function ResolveButtons({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const resolve = (status: "selesai" | "ditolak") =>
    start(async () => {
      const result = await resolveWithdrawal(withdrawalId, status, note);
      setError(result?.error ?? null);
      router.refresh();
    });

  return (
    <div className="mt-3 space-y-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan (opsional), cth: nomor referensi transfer"
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => resolve("selesai")}>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Tandai Sudah Ditransfer
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => resolve("ditolak")}
        >
          <X className="size-3.5" />
          Tolak
        </Button>
      </div>
      {error && (
        <p aria-live="polite" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
