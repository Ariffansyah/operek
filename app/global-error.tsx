"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center font-sans">
        <h1 className="text-lg font-bold">Ada yang error</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Aplikasi gagal dimuat. Coba muat ulang halamannya.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-gray-400">{error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-full bg-[#85ac01] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Coba Lagi
        </button>
      </body>
    </html>
  );
}
