import Link from "next/link";
import { Search } from "lucide-react";
import { Button, EmptyState, Input } from "@/components/ui";
import { ProductGrid } from "@/components/listings/product-card";
import { AutoSubmitSelect } from "./auto-submit-select";
import { DiscoverShell } from "./discover-shell";
import { getListings, getSavedIds, getSession } from "@/lib/data";
import { CAMPUSES, CATEGORIES, CONDITIONS } from "@/lib/utils";

function toArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return raw && Number.isFinite(n) ? n : undefined;
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function DiscoverPage(props: PageProps<"/discover">) {
  const params = await props.searchParams;
  const session = await getSession();

  const q = first(params.q);
  const category = first(params.category);
  const conditions = toArray(params.condition);
  const campuses = toArray(params.campus);
  const sort = first(params.sort) || "terbaru";

  const [listings, savedIds] = await Promise.all([
    getListings({
      q,
      category,
      conditions,
      campuses,
      min: toNumber(params.min),
      max: toNumber(params.max),
      sort,
    }),
    session ? getSavedIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <DiscoverShell
        search={
          <>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari barang..."
              aria-label="Cari barang"
              className="rounded-full bg-gray-50 pl-11"
            />
          </>
        }
        filters={
          <>
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-ink-900">
                Rentang Harga
              </legend>
              <div className="flex items-center gap-2">
                <Input
                  name="min"
                  type="number"
                  min={0}
                  defaultValue={first(params.min)}
                  placeholder="Min"
                  aria-label="Harga minimum"
                />
                <span className="shrink-0 text-xs text-gray-500">s/d</span>
                <Input
                  name="max"
                  type="number"
                  min={0}
                  defaultValue={first(params.max)}
                  placeholder="Maks"
                  aria-label="Harga maksimum"
                />
              </div>
            </fieldset>
  
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-ink-900">Kondisi</legend>
              <div className="space-y-2.5">
                {CONDITIONS.map((c) => (
                  <label key={c} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="condition"
                      value={c}
                      defaultChecked={conditions.includes(c)}
                      className="size-4 rounded border-gray-300 accent-brand-500"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
  
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-ink-900">Kategori</legend>
              <div className="space-y-1">
                <CategoryLink params={params} value="" label="Semua" active={!category} />
                {CATEGORIES.map((c) => (
                  <CategoryLink
                    key={c}
                    params={params}
                    value={c}
                    label={c}
                    active={category === c}
                  />
                ))}
              </div>
            </fieldset>
  
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-ink-900">
                Lokasi Kampus
              </legend>
              <div className="space-y-2.5">
                {CAMPUSES.map((c) => (
                  <label
                    key={c}
                    className="flex items-start gap-2.5 text-sm leading-5 text-gray-700"
                  >
                    <input
                      type="checkbox"
                      name="campus"
                      value={c}
                      defaultChecked={campuses.includes(c)}
                      className="mt-0.5 size-4 shrink-0 rounded border-gray-300 accent-brand-500"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>

            <Button type="submit" className="w-full">
              Terapkan Filter
            </Button>
          </>
        }
        results={
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Menampilkan <strong className="text-ink-900">{listings.length}</strong>{" "}
                hasil
              </p>
              <AutoSubmitSelect name="sort" defaultValue={sort} aria-label="Urutkan">
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Harga terendah</option>
                <option value="termahal">Harga tertinggi</option>
              </AutoSubmitSelect>
            </div>
  
            {listings.length ? (
              <ProductGrid
                listings={listings}
                savedIds={savedIds}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3"
              />
            ) : (
              <EmptyState
                icon={<Search className="size-5" />}
                title="Nggak ada hasil"
                description="Coba ubah kata kunci atau longgarkan filternya."
              />
            )}
          </>
        }
      />
    </div>
  );
}

function CategoryLink({
  params,
  value,
  label,
  active,
}: {
  params: Record<string, string | string[] | undefined>;
  value: string;
  label: string;
  active: boolean;
}) {
  const next = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (key === "category") continue;
    for (const v of toArray(raw)) next.append(key, v);
  }
  if (value) next.set("category", value);

  return (
    <Link
      href={`/discover?${next.toString()}`}
      className={`block rounded-lg px-3 py-2 text-sm ${
        active ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}
