"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="size-5" />
      </span>
      <h2 className="text-lg font-bold text-ink-900">Ada yang error</h2>
      <p className="max-w-sm text-sm text-gray-500">
        Halaman ini gagal dimuat. Coba lagi sebentar.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-gray-400">{error.digest}</p>
      )}
      <Button onClick={reset} pill className="mt-1">
        Coba Lagi
      </Button>
    </div>
  );
}

export function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center px-4 py-24"
    >
      <Loader2 className="size-6 animate-spin text-brand-500" />
      <span className="sr-only">Memuat</span>
    </div>
  );
}
