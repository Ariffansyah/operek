export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatRupiah(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

export function formatRupiahShort(value: number) {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} m`;
  if (value >= 1_000_000)
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000)
    return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return formatRupiah(value);
}

export const PLATFORM_FEE_RATE = 0.03;

export function platformFee(subtotal: number) {
  return Math.round(subtotal * PLATFORM_FEE_RATE);
}

export const CAMPUSES = [
  "Universitas Airlangga",
  "Institut Teknologi Sepuluh Nopember",
  "Universitas Negeri Surabaya",
  "Universitas Surabaya",
  "UPN Veteran Jawa Timur",
  "Universitas Katolik Widya Mandala Surabaya",
  "Universitas dr. Soetomo",
  "Universitas Narotama",
] as const;

export const CATEGORIES = [
  "Buku",
  "Elektronik",
  "Furnitur",
  "Sepeda",
  "Pakaian",
  "Lainnya",
] as const;

export const CONDITIONS = [
  "Seperti Baru",
  "Bagus",
  "Cukup Baik",
  "Bekas",
] as const;

export const DELIVERY_OPTIONS = [
  { value: "cod", label: "Ketemuan langsung (COD)" },
  { value: "kirim", label: "Pengiriman Mandiri" },
] as const;

export const STATUSES = ["Mahasiswa Aktif", "Alumni"] as const;

export const CATEGORY_STYLE: Record<string, string> = {
  Buku: "bg-brand-50 text-brand-700",
  Elektronik: "bg-accent-50 text-accent-600",
  Furnitur: "bg-blue-50 text-blue-600",
  Sepeda: "bg-purple-50 text-purple-600",
  Pakaian: "bg-pink-50 text-pink-600",
  Lainnya: "bg-gray-100 text-gray-600",
};

export const TRANSACTION_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  diproses: "bg-blue-50 text-blue-600",
  selesai: "bg-emerald-100 text-emerald-700",
  dibatalkan: "bg-gray-100 text-gray-600",
};

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID");
}
