import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ConditionBadge } from "@/components/ui";
import { AddToCartButton, SaveButton } from "./card-actions";
import { formatRupiah } from "@/lib/utils";
import type { Listing } from "@/lib/types";

export function ProductCard({
  listing,
  saved = false,
}: {
  listing: Listing;
  saved?: boolean;
}) {
  const cover = listing.images?.[0];
  const sellerName = listing.seller?.full_name ?? "Penjual";

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-gray-100 bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100">
        <Link href={`/product/${listing.id}`} className="block size-full">
          {cover ? (
            <Image
              src={cover}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 50vw, 232px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-gray-400">
              Tanpa foto
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5">
          <ConditionBadge condition={listing.condition} />
        </div>
        <div className="absolute right-2.5 top-2.5">
          <SaveButton listingId={listing.id} saved={saved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <Link
          href={`/product/${listing.id}`}
          className="line-clamp-2 text-sm font-semibold leading-5 text-ink-900 hover:text-brand-700"
        >
          {listing.title}
        </Link>

        <p className="mt-1.5 flex items-start gap-1 text-xs leading-4 text-gray-400">
          <MapPin className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">{listing.campus ?? "Kampus"}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{sellerName.split(" ")[0]}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-sm font-extrabold text-ink-900">
            {formatRupiah(listing.price)}
          </p>
          <AddToCartButton listingId={listing.id} />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  listings,
  savedIds,
  className,
}: {
  listings: Listing[];
  savedIds?: Set<string>;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      }
    >
      {listings.map((listing) => (
        <ProductCard
          key={listing.id}
          listing={listing}
          saved={savedIds?.has(listing.id)}
        />
      ))}
    </div>
  );
}
