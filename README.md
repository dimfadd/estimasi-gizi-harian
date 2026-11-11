# Sekepal — takaran makan pakai tangan

Kalkulator kebutuhan gizi harian yang hasilnya dalam ukuran tangan: kepal nasi, telapak lauk, ruas ibu jari minyak, genggam oat. Untuk satu rumah: tiap anggota keluarga isi tinggi, berat, umur, aktivitas, dan tujuan (turun / jaga / naik berat / bentuk otot), lalu muncul isi piring per waktu makan.

## Isi

Dua mode:

- **Isi data** — hanya untuk orang baru atau saat "Ubah data": formulir, pratinjau target, model tubuh 3D, tombol simpan.
- **Pantau** — tampilan sehari-hari, 4 tab (navigasi bawah di HP):
  1. **Hari ini**: indikator kalori/protein/serat, gula tambahan (batas 50 g), air putih (+1 gelas sekali ketuk), karbo/lemak; catat makan & minum per waktu makan dalam ukuran tangan/gelas, dengan tingkat manis untuk minuman; grafik 7 hari
  2. **Mau makan apa**: isi piring per sarapan/siang/malam, jatah sehari, camilan, cara menakar
  3. **Progres**: catat berat, riwayat berat, bentuk badan 3D sekarang → target, perkiraan waktu
  4. **Profil**: ringkasan data + Ubah data, kode keluarga & anggota, cara hitung

Anggota keluarga dipilih dari bar di bawah header.

Rumus: `lib/nutrition.ts`. Data makanan & ukuran porsi: `lib/foods.ts`. Penjelasannya juga ada di bagian "Cara hitungnya" di halaman.

## Deploy ke Vercel

1. Import repo ini di vercel.com → New Project. Framework otomatis terdeteksi Next.js. Klik Deploy.
2. Di project Vercel: **Storage → Create Database → Neon (Postgres)**, plan Free, lalu Connect ke project ini. Vercel otomatis menambahkan `DATABASE_URL`.
3. **Deployments → Redeploy** supaya env var terbaca.

Tabel `sekepal_entries` dan `sekepal_logs` dibuat otomatis saat data pertama disimpan (skema ada di `db/schema.sql`). Tanpa database, situs tetap jalan dan data disimpan di browser masing-masing.

## Pakai di HP

- Bar di bagian atas menampilkan anggota keluarga yang sudah disimpan. Ketuk nama untuk membuka datanya.
- Kode keluarga hanya diingat per browser. Di HP baru, isi kode di bar atas, atau dari laptop tekan **kirim ke HP** untuk mengirim tautan `/?k=kode`.
- Bisa dipasang seperti aplikasi (PWA): Android/Chrome → tombol **Pasang di HP** di pojok kanan atas; iPhone/Safari → Bagikan → Tambah ke Layar Utama.

## Lokal

```bash
npm install
npm run dev
```

```bash
npm test
```

## Catatan

Angka di sini perkiraan untuk orang dewasa sehat, bukan pengganti ahli gizi. Kode keluarga bukan password: siapa pun yang tahu kodenya bisa melihat data keluarga itu.
