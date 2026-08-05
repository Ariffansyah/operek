import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, GraduationCap, Heart, Package, Star } from "lucide-react";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/layout/header";
import { ProductGrid } from "@/components/listings/product-card";
import { Stars } from "@/components/reviews/stars";
import {
  getListings,
  getProfile,
  getProfileStats,
  getSavedListings,
  getReviews,
  getSavedIds,
  getSession,
} from "@/lib/data";
import { formatRupiahShort, timeAgo } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const TABS = [
  { key: "aktif", label: "Iklan Aktif", ownerOnly: false },
  { key: "terjual", label: "Barang Terjual", ownerOnly: false },
  { key: "ulasan", label: "Ulasan", ownerOnly: false },
  { key: "disimpan", label: "Disimpan", ownerOnly: true },
] as const;

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export default async function ProfilePage(props: PageProps<"/profile/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;

  const profile = await getProfile(id);
  if (!profile) notFound();

  const session = await getSession();
  const isOwn = session?.user.id === profile.id;

  const tabs = TABS.filter((t) => !t.ownerOnly || isOwn);
  const requested =
    (Array.isArray(params.tab) ? params.tab[0] : params.tab) || "aktif";
  const tab = tabs.some((t) => t.key === requested) ? requested : "aktif";

  const [stats, reviews, savedIds] = await Promise.all([
    getProfileStats(profile.id),
    getReviews(profile.id),
    session ? getSavedIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  const listings =
    tab === "ulasan"
      ? []
      : tab === "disimpan"
        ? await getSavedListings(profile.id)
        : await getListings({
            sellerId: profile.id,
            active: tab === "aktif",
          });

  return (
    <div>
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-[1024px] px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-start gap-5">
            <div className="relative shrink-0">
              <Avatar profile={profile} size={88} />
              {profile.is_verified && (
                <span className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white">
                  <BadgeCheck className="size-4" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-ink-900">
                {profile.full_name ?? "Pengguna"}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {[profile.major, profile.university].filter(Boolean).join(" · ") ||
                  "Belum melengkapi profil"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={profile.rating} />
                <span className="text-sm font-semibold text-ink-900">
                  {profile.rating.toLocaleString("id-ID")}
                </span>
                <span className="text-sm text-gray-500">
                  ({reviews.length} ulasan)
                </span>
              </div>
            </div>

            {isOwn && (
              <ButtonLink href="/settings" variant="outline" size="sm" pill>
                Edit Profil
              </ButtonLink>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-gray-100 pt-5">
            <Stat value={String(stats.activeListings)} label="Iklan aktif" />
            <Stat value={String(stats.sold)} label="Barang terjual" />
            <Stat
              value={formatRupiahShort(stats.revenue)}
              label="Total pendapatan"
            />
            <Badge className="bg-brand-50 px-3 py-1.5 text-brand-700">
              <GraduationCap className="size-3.5" />
              {profile.status}
            </Badge>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1024px] gap-6 px-4 sm:px-6">
          {tabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/profile/${profile.id}${key === "aktif" ? "" : `?tab=${key}`}`}
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                tab === key
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-ink-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-[1024px] px-4 py-8 sm:px-6">
        {tab === "ulasan" ? (
          reviews.length ? (
            <ul className="space-y-3">
              {(reviews as unknown as Review[]).map((r) => (
                <li key={r.id}>
                  <Card className="flex gap-4 p-4">
                    <Avatar profile={r.reviewer} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink-900">
                          {r.reviewer?.full_name ?? "Pengguna"}
                        </p>
                        <span className="text-xs text-gray-400">
                          {timeAgo(r.created_at)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <Stars rating={r.rating} size="size-3.5" />
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm text-gray-700">{r.comment}</p>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Star className="size-5" />}
              title="Belum ada ulasan"
              description="Ulasan dari pembeli bakal muncul di sini setelah transaksi selesai."
            />
          )
        ) : listings.length ? (
          <ProductGrid listings={listings} savedIds={savedIds} />
        ) : (
          <EmptyState
            icon={
              tab === "disimpan" ? (
                <Heart className="size-5" />
              ) : (
                <Package className="size-5" />
              )
            }
            title={
              tab === "disimpan"
                ? "Belum ada barang disimpan"
                : tab === "aktif"
                  ? "Belum ada iklan aktif"
                  : "Belum ada barang terjual"
            }
            description={
              tab === "disimpan"
                ? "Tekan ikon hati di kartu barang untuk menyimpannya ke sini."
                : isOwn
                  ? "Posting iklan pertamamu dan mulai jualan."
                  : "Pengguna ini belum punya barang di sini."
            }
            action={
              tab === "disimpan" ? (
                <ButtonLink href="/discover" className="mt-2">
                  Cari Barang
                </ButtonLink>
              ) : isOwn && tab === "aktif" ? (
                <ButtonLink href="/sell" className="mt-2">
                  Buat Iklan
                </ButtonLink>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold text-ink-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
