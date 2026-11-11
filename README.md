# Sekepal — takaran makan pakai tangan

Kalkulator kebutuhan gizi harian yang hasilnya dalam ukuran tangan: kepal nasi, telapak lauk, ruas ibu jari minyak, genggam oat. Untuk satu rumah: tiap anggota keluarga isi tinggi, berat, umur, aktivitas, dan tujuan (turun / jaga / naik berat / bentuk otot), lalu muncul isi piring per waktu makan.

## Isi

- Formulir data diri, hasil berubah langsung saat diisi
- Model tubuh 3D (three.js) dengan slider bentuk sekarang → target
- Jatah sehari: kalori, protein/karbo/lemak, dan versi tangannya
- Isi piring per sarapan/siang/malam: pilih karbo dan lauk, porsi nasi menyesuaikan lauk supaya kalori tetap pas
- Camilan: jatah camilan dan "camilan jebakan" dalam menit jalan cepat
- Perkiraan waktu sampai berat target
- Simpan per anggota keluarga dengan kode keluarga (Postgres/Neon), riwayat berat

Rumus: `lib/nutrition.ts`. Data makanan & ukuran porsi: `lib/foods.ts`. Penjelasannya juga ada di bagian "Cara hitungnya" di halaman.

## Deploy ke Vercel

1. Import repo ini di vercel.com → New Project. Framework otomatis terdeteksi Next.js. Klik Deploy.
2. Di project Vercel: **Storage → Create Database → Neon (Postgres)**, plan Free, lalu Connect ke project ini. Vercel otomatis menambahkan `DATABASE_URL`.
3. **Deployments → Redeploy** supaya env var terbaca.

Tabel dibuat otomatis saat data pertama disimpan (skema ada di `db/schema.sql`). Tanpa database, situs tetap jalan dan data disimpan di browser masing-masing.

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
