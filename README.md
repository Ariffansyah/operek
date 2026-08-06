# operek

Tempat jual beli barang bekas khusus mahasiswa dan alumni di Surabaya. Buku,
perlengkapan kos, elektronik, sepeda, dan lainnya.

## Tech stack

| Bagian | Dipakai |
| --- | --- |
| Framework | Next.js 16.3.0 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Ikon | lucide-react |
| Font | Plus Jakarta Sans lewat `next/font/google` |
| Backend | Supabase (Auth, Postgres, Storage) |
| Pembayaran | Paymenku, QRIS saja |

Desain diambil dari Figma, file key `tRGivMBE3q8G5zzSa0tCXq`.

## Menjalankan

```bash
pnpm install
pnpm dev
```

Aplikasi jalan di [http://localhost:3001](http://localhost:3001).

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Server pengembangan di port 3001 |
| `pnpm build` | Build produksi |
| `pnpm start` | Server produksi di port 3001 |
| `pnpm lint` | ESLint |

## Konfigurasi awal

### 1. Environment

Salin `.env.local.example` jadi `.env.local`, lalu isi:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYMENKU_SECRET_KEY=
PAYMENKU_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

`NEXT_PUBLIC_APP_URL` hanya dipakai untuk URL redirect Paymenku setelah bayar.
Karena berawalan `NEXT_PUBLIC_`, nilainya ditanam saat build, jadi setelah
diubah perlu build ulang, tidak cukup restart.

### 2. Database

Jalankan `supabase/schema.sql` di SQL editor Supabase. Isinya tabel, index,
trigger pembuat profil, bucket storage, dan penguncian akses.

Kalau pendaftaran akun gagal dengan error 500, jalankan
`supabase/repair-signup.sql`. Penyebabnya trigger `on_auth_user_created`
dijalankan oleh role `supabase_auth_admin`, sedangkan `revoke all` di akhir
schema memutus jalurnya. File itu memasang `search_path`, kepemilikan definer,
dan grant yang dibutuhkan.

### 3. Supabase Auth

Di dashboard, buka Authentication lalu URL Configuration:

- Site URL: alamat aplikasi
- Redirect URLs: tambahkan `https://domainmu.com/**`

Tanpa ini, link konfirmasi email dan reset kata sandi akan diarahkan balik ke
Site URL, bukan ke halaman yang benar.

### 4. Paymenku

Base URL API-nya `https://paymenku.com/api/v1`, dan transaksi dibuat lewat
`POST /transaction/create` dengan `channel_code: "qris"`. Kalau suatu saat
berubah, timpa lewat env `PAYMENKU_BASE_URL`.

API Key diambil dari Dashboard, menu **Settings > API Keys**. Key sandbox
berawalan `sk_test_`, key produksi `sk_live_`. Isikan ke `PAYMENKU_SECRET_KEY`.

Webhook Secret **tempatnya terpisah** dari API Key. Buka **Settings > Webhook**,
isi URL endpoint ke `https://domainmu.com/api/paymenku-webhook`, simpan, lalu
Webhook Secret-nya baru muncul untuk disalin ke `PAYMENKU_WEBHOOK_SECRET`.
Selama webhook belum didaftarkan, secret itu memang belum ada.

Signature-nya `HMAC-SHA256(timestamp + "." + raw_body, webhook_secret)`, dikirim
lewat header `X-PaymenKu-Signature` dan `X-PaymenKu-Timestamp`. Request yang
tanda tangannya tidak cocok ditolak dengan 401.

### 5. Domain non-localhost saat development

Kalau server dev diakses lewat domain, bukan localhost, tambahkan domainnya ke
`allowedDevOrigins` di `next.config.ts`, lalu restart. Tanpa itu Next.js
memblokir permintaan ke resource dev seperti HMR.

## Struktur

```
app/
  (auth)/          login, register, forgot-password
  (main)/          beranda, discover, product, sell, cart,
                   inbox, notifications, transactions, profile, settings
  auth/callback/   tukar kode dari email jadi sesi
  api/             webhook Paymenku
  payment/         halaman hasil pembayaran
components/
  layout/          header dan navigasi
  listings/        kartu produk
  ui/              tombol, input, kartu, badge, state kosong
lib/
  supabase/        client browser, server, dan service role
  actions.ts       Server Actions
  data.ts          query baca
  notifications.ts feed notifikasi turunan
  paymenku.ts      pembuatan invoice
supabase/          schema.sql dan repair-signup.sql
proxy.ts           penyegaran sesi dan penjaga rute
```

Setiap segmen rute punya `loading.tsx` dan `error.tsx`.

## Catatan arsitektur

**Akses data lewat service role.** `schema.sql` mencabut hak anon dan
authenticated dari semua tabel di schema public, jadi database tidak bisa
disentuh langsung pakai cURL atau Postman dengan kunci publik. Semua query
jalan di server lewat Server Component dan Server Action memakai
`SUPABASE_SERVICE_ROLE_KEY`. Client browser hanya dipakai untuk autentikasi.

**`proxy.ts`, bukan `middleware.ts`.** Next.js 16 mengganti nama konvensi ini.
Isinya penyegaran cookie sesi dan penjagaan rute yang butuh login.

**Chat memakai polling, bukan Realtime.** Realtime mengirim baris ke browser
memakai hak akses milik client, sedangkan hak itu sudah dicabut. Thread pesan
menyegarkan Server Component tiap 5 detik. Kalau suatu saat penguncian
dilonggarkan khusus tabel `messages`, publikasi Realtime-nya sudah disiapkan di
schema.

**Notifikasi diturunkan dari data lain.** Tidak ada tabel `notifications`.
Feed dirakit dari pesan masuk, penjualan, pembayaran, dan iklan yang disimpan
orang.

**Biaya platform 3 persen** ditambahkan di atas harga barang saat checkout.
Satu keranjang menghasilkan satu invoice Paymenku dan satu baris transaksi per
penjual.

## Alur pembayaran

1. Checkout membuat baris transaksi berstatus `pending` dan satu invoice QRIS.
2. Pembeli membayar di halaman Paymenku.
3. Webhook `PAYMENT_SUCCEEDED` mengubah status jadi `diproses`, menonaktifkan
   iklan, dan mengosongkan keranjang pembeli.
4. Webhook `PAYMENT_FAILED` mengubah status jadi `dibatalkan`.
5. Pembeli menekan konfirmasi terima, status jadi `selesai`, lalu bisa memberi
   ulasan.

Pengiriman ada dua pilihan, ketemuan langsung (COD) dan pengiriman mandiri.
Ongkir pengiriman mandiri tidak ditanggung aplikasi.

## Data acuan

- Kampus terbatas pada delapan perguruan tinggi di Surabaya, lihat `CAMPUSES`
  di `lib/utils.ts`
- Kategori: Buku, Elektronik, Furnitur, Sepeda, Pakaian, Lainnya
- Kondisi: Seperti Baru, Bagus, Cukup Baik, Bekas
- Status akun: Mahasiswa Aktif atau Alumni, keduanya setara tanpa pembatasan
  domain email
