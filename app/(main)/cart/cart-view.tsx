"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Minus, Plus, Shield, Trash2 } from "lucide-react";
import { Button, Card, ConditionBadge } from "@/components/ui";
import { checkout, removeCartItem, setCartQuantity } from "@/lib/actions";
import { DELIVERY_OPTIONS, formatRupiah, platformFee } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

const DELIVERY_HINT: Record<string, string> = {
  cod: "Sepakati tempat ketemu sama penjual",
  kirim: "Penjual urus pengiriman sendiri, tidak ditanggung operek",
};

export function CartView({ items }: { items: CartItem[] }) {
  const [delivery, setDelivery] = useState<string>("cod");
  const [error, setError] = useState<string | null>(null);
  const [paying, startPaying] = useTransition();

  const subtotal = items.reduce(
    (sum, item) => sum + (item.listing?.price ?? 0) * item.quantity,
    0,
  );
  const fee = platformFee(subtotal);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {items.map((item) => (
          <CartRow key={item.id} item={item} />
        ))}
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="p-5">
          <h2 className="font-bold text-ink-900">Metode Pengiriman</h2>
          <div className="mt-4 space-y-3">
            {DELIVERY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-field border p-3.5 transition-colors ${
                  delivery === option.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={option.value}
                  checked={delivery === option.value}
                  onChange={() => setDelivery(option.value)}
                  className="mt-0.5 size-4 shrink-0 accent-brand-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-gray-500">
                    {DELIVERY_HINT[option.value]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-ink-900">Ringkasan Pesanan</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal ({items.length} barang)</dt>
              <dd className="font-semibold text-ink-900">{formatRupiah(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Biaya platform (3%)</dt>
              <dd className="font-semibold text-ink-900">{formatRupiah(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <dt className="font-bold text-ink-900">Total</dt>
              <dd className="text-lg font-extrabold text-ink-900">
                {formatRupiah(subtotal + fee)}
              </dd>
            </div>
          </dl>

          <Button
            variant="accent"
            size="lg"
            pill
            disabled={paying}
            className="mt-5 w-full"
            onClick={() =>
              startPaying(async () => {
                setError(null);
                const result = await checkout(delivery);
                if (result?.error) setError(result.error);
              })
            }
          >
            {paying ? <Loader2 className="size-4 animate-spin" /> : null}
            Lanjut ke Pembayaran
            {!paying && <ArrowRight className="size-4" />}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Shield className="size-3.5" />
            Bayar pakai QRIS via Paymenku
          </p>

          {error && (
            <p aria-live="polite" className="mt-3 text-center text-xs text-red-600">
              {error}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [, start] = useTransition();
  const listing = item.listing;
  if (!listing) return null;

  const update = (next: number) => {
    if (next < 1 || next > 99) return;
    setQuantity(next);
    start(() => void setCartQuantity(item.id, next));
  };

  return (
    <Card className="flex gap-4 p-4">
      <Link
        href={`/product/${listing.id}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-gray-100"
      >
        {listing.images?.[0] && (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${listing.id}`}
          className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-brand-700"
        >
          {listing.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {listing.seller?.full_name} · {listing.campus}
        </p>
        <div className="mt-1.5">
          <ConditionBadge condition={listing.condition} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-1">
          <StepperButton label="Kurangi" onClick={() => update(quantity - 1)}>
            <Minus className="size-3.5" />
          </StepperButton>
          <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
          <StepperButton label="Tambah" onClick={() => update(quantity + 1)}>
            <Plus className="size-3.5" />
          </StepperButton>
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-ink-900">
            {formatRupiah(listing.price * quantity)}
          </p>
          <p className="text-xs text-gray-400">
            {formatRupiah(listing.price)} / item
          </p>
        </div>

        <button
          type="button"
          aria-label="Hapus dari keranjang"
          onClick={() => start(() => void removeCartItem(item.id))}
          className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </Card>
  );
}

function StepperButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
