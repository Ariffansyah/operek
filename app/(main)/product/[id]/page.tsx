import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Handshake, MapPin, Truck } from "lucide-react";
import { Badge, ButtonLink, Card, ConditionBadge } from "@/components/ui";
import { Avatar } from "@/components/layout/header";
import { ProductGrid } from "@/components/listings/product-card";
import { Gallery } from "./gallery";
import { DetailActions } from "./detail-actions";
import { Stars } from "@/components/reviews/stars";
import { getListing, getListings, getSavedIds, getSession } from "@/lib/data";
import { formatRupiah } from "@/lib/utils";

export default async function ProductPage(props: PageProps<"/product/[id]">) {
  const { id } = await props.params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const session = await getSession();
  const [similar, savedIds] = await Promise.all([
    getListings({ category: listing.category, limit: 5 }),
    session ? getSavedIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  const seller = listing.seller;
  const isOwnListing = session?.user.id === listing.seller_id;

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-6 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-ink-900">
          Beranda
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/discover?category=${encodeURIComponent(listing.category)}`}
          className="hover:text-ink-900"
        >
          {listing.category}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-ink-900">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <Gallery images={listing.images ?? []} title={listing.title} />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <ConditionBadge condition={listing.condition} />
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="size-3.5" />
              {listing.campus ?? "Kampus"}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-8 text-ink-900">
            {listing.title}
          </h1>
          <p className="mt-2 text-3xl font-extrabold text-ink-900">
            {formatRupiah(listing.price)}
          </p>

          <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Deskripsi
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
            {listing.description || "Penjual belum menulis deskripsi."}
          </p>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Opsi Pengiriman
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-brand-50 px-3 py-1.5 text-brand-700">
              <Handshake className="size-3.5" />
              Ketemuan (COD)
            </Badge>
            <Badge className="bg-blue-50 px-3 py-1.5 text-blue-600">
              <Truck className="size-3.5" />
              Pengiriman Mandiri
            </Badge>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Pembeli memilih metode pengiriman saat checkout.
          </p>

          <DetailActions
            listingId={listing.id}
            sellerId={listing.seller_id}
            isOwnListing={isOwnListing}
            signedIn={Boolean(session)}
          />
        </div>
      </div>

      {seller && (
        <Card className="mt-8 flex flex-wrap items-center gap-4 p-5">
          <Avatar profile={seller} size={56} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink-900">{seller.full_name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <Stars rating={seller.rating ?? 0} />
              <span className="text-sm font-semibold text-ink-900">
                {(seller.rating ?? 0).toLocaleString("id-ID")}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{seller.university}</p>
          </div>
          <ButtonLink
            href={`/profile/${seller.id}`}
            variant="outline"
            size="sm"
            pill
            className="border-brand-500 text-brand-700"
          >
            Lihat Profil
          </ButtonLink>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold text-ink-900">Barang Serupa</h2>
        <div className="mt-5">
          {similar.filter((l) => l.id !== listing.id).length ? (
            <ProductGrid
              listings={similar.filter((l) => l.id !== listing.id).slice(0, 4)}
              savedIds={savedIds}
            />
          ) : (
            <p className="text-sm text-gray-500">Belum ada barang serupa.</p>
          )}
        </div>
      </section>
    </div>
  );
}
