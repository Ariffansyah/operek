"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Handshake,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Shield,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { Button, Card, ConditionBadge, Field, Input, Select, Textarea } from "@/components/ui";
import { createListing, uploadListingImage } from "@/lib/actions";
import {
  CAMPUSES,
  CATEGORIES,
  CONDITIONS,
  cn,
  formatRupiah,
} from "@/lib/utils";

const STEPS = ["Foto", "Detail", "Harga", "Preview"] as const;
const MAX_PHOTOS = 5;
const MAX_DESCRIPTION = 500;

type Draft = {
  images: string[];
  title: string;
  category: string;
  condition: string;
  description: string;
  price: string;
  delivery: string[];
  campus: string;
};

export function SellWizard({ defaultCampus }: { defaultCampus: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    images: [],
    title: "",
    category: "",
    condition: "",
    description: "",
    price: "",
    delivery: [],
    campus: defaultCampus,
  });
  const [error, setError] = useState<string | null>(null);
  const [posting, startPosting] = useTransition();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canContinue = [
    draft.images.length > 0,
    draft.title.trim() && draft.category && draft.condition,
    Number(draft.price) > 0 && draft.delivery.length > 0 && draft.campus,
    true,
  ][step];

  const post = () =>
    startPosting(async () => {
      setError(null);
      const result = await createListing({
        title: draft.title,
        description: draft.description,
        price: Number(draft.price),
        category: draft.category,
        condition: draft.condition,
        delivery: draft.delivery,
        campus: draft.campus,
        images: draft.images,
      });
      if (result?.error) setError(result.error);
      else if (result?.id) router.push(`/product/${result.id}`);
    });

  return (
    <div className="min-h-full bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-[1024px] items-center gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink-900">Buat Iklan Baru</h1>
            <p className="text-xs text-gray-500">
              Langkah {step + 1} dari 4: {STEPS[step]}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-[1024px] items-center justify-center gap-2 overflow-x-auto px-4 py-4 sm:gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                  i < step
                    ? "bg-brand-500 text-white"
                    : i === step
                      ? "bg-ink-900 text-white"
                      : "bg-gray-100 text-gray-400",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  i === step ? "text-ink-900" : "text-gray-400",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-0.5 w-6 rounded sm:w-12",
                    i < step ? "bg-brand-500" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[420px] px-4 py-8">
        {step === 0 && (
          <PhotoStep
            images={draft.images}
            onChange={(images) => set("images", images)}
          />
        )}

        {step === 1 && (
          <section>
            <StepHeading
              title="Detail Barang"
              subtitle="Isi info barang sejelas mungkin ya."
            />
            <div className="mt-6 space-y-4">
              <Field label="Judul Iklan" htmlFor="title">
                <Input
                  id="title"
                  value={draft.title}
                  maxLength={120}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Cth: Buku Kalkulus Edisi 9, kondisi bagus"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategori" htmlFor="category">
                  <Select
                    id="category"
                    value={draft.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="">Pilih kategori</option>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Kondisi" htmlFor="condition">
                  <Select
                    id="condition"
                    value={draft.condition}
                    onChange={(e) => set("condition", e.target.value)}
                  >
                    <option value="">Pilih kondisi</option>
                    {CONDITIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Deskripsi" htmlFor="description">
                <Textarea
                  id="description"
                  rows={4}
                  maxLength={MAX_DESCRIPTION}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Ceritain kondisi barang, alasan jual, kelengkapan, dll. Makin detail makin bagus!"
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {draft.description.length}/{MAX_DESCRIPTION}
                </p>
              </Field>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <StepHeading
              title="Harga dan Pengiriman"
              subtitle="Tentuin harga dan cara pengambilan barang."
            />
            <div className="mt-6 space-y-4">
              <Field label="Harga Jual (Rp)" htmlFor="price">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    Rp
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0"
                    className="pl-11"
                  />
                </div>
              </Field>

              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-ink-900">
                  Metode Pengiriman
                </legend>
                <div className="space-y-3">
                  <DeliveryCard
                    icon={<Handshake className="size-4 text-gray-500" />}
                    title="Ketemuan langsung (COD)"
                    hint="Sepakati tempat dan waktu dengan pembeli"
                    checked={draft.delivery.includes("cod")}
                    onToggle={() => toggle("cod")}
                  />
                  <DeliveryCard
                    icon={<Truck className="size-4 text-gray-500" />}
                    title="Pengiriman Mandiri"
                    hint="Urus pengiriman sendiri, tidak ditanggung operek"
                    checked={draft.delivery.includes("kirim")}
                    onToggle={() => toggle("kirim")}
                  />
                </div>
              </fieldset>

              <Field label="Lokasi Kampus" htmlFor="campus">
                <Select
                  id="campus"
                  value={draft.campus}
                  onChange={(e) => set("campus", e.target.value)}
                >
                  <option value="">Pilih lokasi</option>
                  {CAMPUSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <StepHeading
              title="Cek Iklanmu"
              subtitle="Begini tampilan iklanmu nanti. Pastiin semuanya sudah bener."
            />

            <Card className="mt-6 overflow-hidden">
              <div className="relative aspect-[16/10] w-full bg-gray-100">
                {draft.images[0] && (
                  <Image
                    src={draft.images[0]}
                    alt=""
                    fill
                    sizes="420px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-ink-900">{draft.title}</p>
                  <p className="shrink-0 font-extrabold text-ink-900">
                    {formatRupiah(Number(draft.price) || 0)}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ConditionBadge condition={draft.condition} />
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="size-3" />
                    {draft.campus}
                  </span>
                </div>
                {draft.description && (
                  <p className="mt-3 text-sm text-gray-700">{draft.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {draft.delivery.includes("cod") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      <Handshake className="size-3" />
                      Ketemuan
                    </span>
                  )}
                  {draft.delivery.includes("kirim") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                      <Truck className="size-3" />
                      Dikirim
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <p className="mt-5 flex gap-2 rounded-field border border-brand-500/30 bg-brand-50 p-3.5 text-xs leading-5 text-brand-700">
              <Shield className="mt-0.5 size-4 shrink-0" />
              Dengan memposting iklan, kamu setuju bahwa info yang dicantumkan benar
              dan barang yang dijual sah milikmu.
            </p>
          </section>
        )}

        {error && (
          <p aria-live="polite" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              size="lg"
              pill
              onClick={() => setStep(step - 1)}
              className="shrink-0"
            >
              Kembali
            </Button>
          )}
          {step < 3 ? (
            <Button
              size="lg"
              pill
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
              className="flex-1"
            >
              Lanjut
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="lg" pill disabled={posting} onClick={post} className="flex-1">
              {posting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Posting Iklan Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  function toggle(value: string) {
    setDraft((d) => ({
      ...d,
      delivery: d.delivery.includes(value)
        ? d.delivery.filter((v) => v !== value)
        : [...d.delivery, value],
    }));
  }
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function PhotoStep({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);

    const room = MAX_PHOTOS - images.length;
    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadListingImage(formData);
      if (result?.error) setError(result.error);
      else if (result?.url) uploaded.push(result.url);
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section>
      <StepHeading
        title="Upload Foto Barang"
        subtitle={`Foto yang bagus bikin barang lebih cepat laku. Maks ${MAX_PHOTOS} foto.`}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div
            key={src}
            className="relative size-28 overflow-hidden rounded-field bg-gray-100"
          >
            <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            <button
              type="button"
              aria-label={`Hapus foto ${i + 1}`}
              onClick={() => onChange(images.filter((s) => s !== src))}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-gray-600 hover:text-red-600"
            >
              <X className="size-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                Utama
              </span>
            )}
          </div>
        ))}

        {images.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex size-28 flex-col items-center justify-center gap-2 rounded-field border border-dashed border-gray-300 text-xs text-gray-400 hover:border-brand-500 hover:text-brand-700"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            {uploading ? "Mengunggah" : "Tambah foto"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-5 flex gap-2 rounded-field border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        Foto pertama jadi foto utama iklan. Foto dari berbagai sudut bisa ningkatin
        kepercayaan pembeli.
      </p>
    </section>
  );
}

function DeliveryCard({
  icon,
  title,
  hint,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-field border p-3.5 transition-colors",
        checked ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:bg-gray-50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 size-4 shrink-0 rounded border-gray-300 accent-brand-500"
      />
      <span className="shrink-0 pt-0.5">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-4 text-gray-500">{hint}</span>
      </span>
    </label>
  );
}
