# Sekepal — takaran makan pakai tangan

Aplikasi web untuk menghitung kebutuhan gizi harian dan mencatat makan dengan ukuran tangan (kepal, telapak, ruas ibu jari, genggam). Login dengan Google; satu akun bisa berisi beberapa profil keluarga.

## Isi

- **Halaman depan** untuk yang belum masuk, login Google, layar persetujuan privasi.
- **Isi data** (hanya untuk profil baru / ubah data): formulir, pratinjau target, model tubuh 3D.
- **Mode pantau**, 4 tab:
  1. **Hari ini**: indikator kalori, protein, serat, gula tambahan, air putih, karbo, lemak; catat makan & minum dengan **pencarian 250+ makanan Indonesia** (toleran salah ketik), tab Terakhir & Favorit, "Sama seperti kemarin", "Makan sesuai rencana", makanan buatan sendiri, tingkat manis untuk minuman, grafik 7 hari.
  2. **Mau makan apa**: isi piring per waktu makan, jatah sehari, camilan, cara menakar.
  3. **Progres**: catat berat, riwayat, bentuk badan 3D, perkiraan waktu.
  4. **Profil**: data diri, masukan beta, akun (klaim data lama, izin foto, unduh data, keluar, hapus akun).
- **Pro** (fitur terkunci terlihat oleh pengguna gratis, dengan tombol "Saya mau Pro" yang mencatat minat):
  - **Catat dari foto**: AI (Claude) membaca foto piring/minuman dan menulis draf dalam satuan tangan; pengguna mengoreksi lalu menyimpan. Draf AI dan versi akhirnya disimpan untuk mengukur akurasi di `/admin`.
  - **Latihan**: 15 gerakan gym dengan animasi 3D, otot utama merah dan pendukung merah muda; catat set (kg × repetisi). Kardio & olahraga lain (lari, sepeda, renang, futsal, badminton, bela diri, …) dengan jarak + durasi/pace/kecepatan.
  - **Target ikut aktivitas**: olahraga yang melebihi rata-rata harian (yang sudah ada di target) menambah jatah makan hari itu; perkiraan perubahan berat dari catatan makan + olahraga di tab Progres.
- **Beta**: analitik retensi (`/admin`), pencarian yang tidak menemukan hasil, masukan pengguna, dan pengumpulan foto piring berlabel (opsional, dengan izin) untuk menguji fitur foto nanti.
- **Privasi**: `/privasi`, ekspor JSON, hapus akun (semua data ikut terhapus).

Kode penting:

| File | Isi |
|---|---|
| `lib/nutrition.ts` | rumus kebutuhan & isi piring |
| `lib/fooddb.ts` | database makanan (tambah makanan di sini; jangan ganti `id` yang sudah ada) |
| `lib/search.ts` | pencarian makanan |
| `lib/db.ts` | koneksi & migrasi database (otomatis saat pertama dipakai) |
| `auth.ts` | login Google |
| `app/api/*` | API; setiap query dibatasi ke akun yang sedang login |
| `lib/server/stats.ts` | angka halaman admin |
| `lib/exercises.ts` | gerakan latihan: otot, alat, langkah, pose animasi |
| `lib/rig.ts` | kerangka manekin 3D (dipakai animasi & tes pose) |
| `lib/activity.ts` | kalori olahraga (MET, lari per km, sepeda per kecepatan) |
| `app/api/photo/route.ts` | catat dari foto (Claude API, structured output) |

## Deploy ke Vercel

1. **Project**: vercel.com → Add New → Project → import repo ini. Framework: Next.js.
2. **Database**: di project → Storage → Create → **Neon (Postgres)**, plan Free → Connect. `DATABASE_URL` terisi otomatis. Tabel dibuat sendiri saat aplikasi pertama dipakai.
3. **Login Google** di [console.cloud.google.com](https://console.cloud.google.com):
   1. Buat project baru (mis. "Sekepal").
   2. APIs & Services → **OAuth consent screen**: tipe *External*, nama aplikasi "Sekepal", email dukungan, tautan kebijakan privasi `https://DOMAINMU/privasi`. Scope cukup `openid`, `email`, `profile`.
   3. Setelah selesai, tekan **Publish app**. Selama masih *Testing*, hanya akun yang didaftarkan sebagai test user yang bisa masuk.
   4. APIs & Services → **Credentials** → Create credentials → **OAuth client ID** → *Web application*.
      - Authorized JavaScript origins: `https://DOMAINMU`
      - Authorized redirect URIs: `https://DOMAINMU/api/auth/callback/google`
   5. Salin Client ID & Client secret.
4. **Environment Variables** di Vercel (Settings → Environment Variables):

   | Nama | Isi |
   |---|---|
   | `AUTH_SECRET` | hasil `npx auth secret` atau `openssl rand -base64 32` |
   | `AUTH_GOOGLE_ID` | Client ID dari langkah 3 |
   | `AUTH_GOOGLE_SECRET` | Client secret dari langkah 3 |
   | `ADMIN_EMAILS` | email Google-mu, supaya bisa membuka `/admin` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | (opsional) email kontak di halaman privasi |

5. **Pro**: isi `ANTHROPIC_API_KEY` (dari console.anthropic.com) supaya fitur foto aktif. Opsional `PHOTO_MODEL` dan `PRO_EMAILS`.
   Akses Pro diberikan dari `/admin` → Pro → "Beri Pro" (email + jumlah hari). Pembayaran otomatis (Scalev) belum disambungkan.
6. (Opsional) **Foto sampel beta**: Storage → Create → **Blob** → Connect. `BLOB_READ_WRITE_TOKEN` terisi otomatis.
7. **Redeploy**. Kalau ada variabel yang kurang, halaman utama menampilkan daftar nama variabel yang belum diisi.

Pengguna versi lama (kode keluarga) bisa memindahkan datanya di **Profil → Akun → Pindahkan**. Data dipindah, bukan disalin, jadi kode lama tidak bisa dipakai lagi untuk melihat data.

## Menjalankan di komputer sendiri

Butuh Node 20+ dan Postgres.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan `DATABASE_URL=postgres://postgres@127.0.0.1:5432/sekepal`, `AUTH_SECRET=` (bebas, panjang), dan `DEV_LOGIN=1` untuk login uji tanpa Google (email harus berakhiran `@dev.local`; otomatis mati di Vercel).

```bash
npm run dev
```

```bash
npm test
```

## Membaca halaman admin

- **Retensi H+7 / H+30**: dari pengguna yang daftar minimal 7/30 hari lalu, berapa persen yang membuka aplikasi lagi di jendela itu. Ini angka utama untuk memutuskan lanjut ke versi Pro.
- **Dicari tapi tidak ada**: daftar makanan untuk ditambahkan ke `lib/fooddb.ts`.
- **Sampel foto**: unduh JSON berisi URL foto dan isi piring yang dikonfirmasi pengguna, untuk menguji akurasi model sebelum membangun fitur foto.

## Biaya fitur foto

Setiap foto = satu panggilan Claude API. Katalog makanan dikirim sebagai prompt sistem yang di-cache, jadi bagian terbesar biayanya adalah gambar dan jawaban. Batas 20 foto per akun per hari (`DAILY_LIMIT` di `app/api/photo/route.ts`). Jumlah token yang terpakai terlihat di `/admin` → Foto AI; pakai angka itu untuk menghitung biaya per pengguna Pro sebelum menentukan harga.

## Catatan

Angka di Sekepal adalah perkiraan untuk orang dewasa sehat, bukan nasihat medis. Data gizi dari TKPI dan USDA; porsi hidangan jadi adalah rata-rata warung dan bisa meleset 20–30%.
