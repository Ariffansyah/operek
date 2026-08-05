import Link from "next/link";
import {
  ArrowRight,
  Bike,
  BookOpen,
  ChevronRight,
  Handshake,
  Laptop,
  Search,
  Shield,
  Shirt,
  Sofa,
  TrendingUp,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { ProductGrid } from "@/components/listings/product-card";
import { getListings, getSavedIds, getSession } from "@/lib/data";
import { CATEGORY_STYLE } from "@/lib/utils";

const CATEGORY_ICONS = {
  Buku: BookOpen,
  Elektronik: Laptop,
  Furnitur: Sofa,
  Sepeda: Bike,
  Pakaian: Shirt,
} as const;

export default async function HomePage() {
  const session = await getSession();
  const [listings, savedIds] = await Promise.all([
    getListings({ limit: 8 }),
    session ? getSavedIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-800">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,#4a6200_0%,transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(133,172,1,0.35)_0%,transparent_50%)]"
        />
        <div className="relative mx-auto max-w-[1024px] px-6 py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white sm:text-sm">
            <Zap className="size-3.5" />
            Platform terpercaya untuk jual beli barang bekas mahasiswa surabaya
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.15]">
            Jual &amp; beli{" "}
            <span className="text-brand-400">barang kampus</span>
            <br className="hidden sm:block" /> sesama mahasiswa
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Tempat jual beli barang bekas khusus mahasiswa dan alumni. Buku,
            perlengkapan kos, elektronik, dan masih banyak lagi.
          </p>

          <form
            action="/discover"
            className="mx-auto mt-10 flex max-w-[672px] items-center gap-3 rounded-card bg-white p-2 shadow-2xl"
          >
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search className="size-5 shrink-0 text-gray-400" />
              <input
                name="q"
                placeholder="Cari buku, elektronik, furnitur..."
                aria-label="Cari barang"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-card bg-accent-500 px-5 text-sm font-semibold text-white hover:bg-accent-600 sm:px-6"
            >
              Cari
              <ArrowRight className="size-4" />
            </button>
          </form>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
            <li className="flex items-center gap-1.5">
              <Shield className="size-4" /> Khusus mahasiswa
            </li>
            <li className="flex items-center gap-1.5">
              <TrendingUp className="size-4" /> Terpercaya &amp; aman
            </li>
            <li className="flex items-center gap-1.5">
              <Handshake className="size-4" /> Ketemuan atau dikirim
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-[1024px] px-4 py-12 sm:px-6">
        <section>
          <h2 className="text-xl font-bold text-ink-900">Jelajahi Kategori</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
              <Link
                key={name}
                href={`/discover?category=${encodeURIComponent(name)}`}
                className={`inline-flex h-11 items-center gap-2.5 rounded-full px-5 text-sm font-semibold ${CATEGORY_STYLE[name]}`}
              >
                <Icon className="size-4" />
                {name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink-900">Baru di Kampus</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Baru aja diposting mahasiswa di sekitarmu
              </p>
            </div>
            <Link
              href="/discover"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700"
            >
              Lihat semua
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-5">
            {listings.length ? (
              <ProductGrid listings={listings} savedIds={savedIds} />
            ) : (
              <p className="rounded-card border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">
                Belum ada iklan. Jadi yang pertama posting!
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="bg-ink-800">
        <div className="mx-auto flex max-w-[1024px] flex-col items-center gap-5 px-6 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Mulai Berjualan, <span className="text-brand-400">Gratis!</span>
          </h2>
          <p className="max-w-lg text-sm text-white/70">
            Barang nganggur di kos bisa jadi uang jajan. Posting iklan cuma
            butuh beberapa menit.
          </p>
          <ButtonLink href="/sell" variant="accent" size="lg" pill>
            Posting Iklan Sekarang
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
