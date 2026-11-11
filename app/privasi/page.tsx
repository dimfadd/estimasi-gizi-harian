import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan privasi · Sekepal",
  description: "Data apa yang disimpan Sekepal, untuk apa, dan bagaimana menghapusnya.",
};

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const UPDATED = "11 November 2026";

export default function Privasi() {
  return (
    <main className="wrap legal">
      <p>
        <Link href="/">← Kembali ke Sekepal</Link>
      </p>
      <h1>Kebijakan privasi</h1>
      <p className="fine">Terakhir diperbarui {UPDATED}</p>

      <p>
        Sekepal membantu menakar dan mencatat makan dengan ukuran tangan. Untuk itu Sekepal menyimpan data tentang tubuh dan pola makanmu. Data
        seperti ini termasuk data pribadi yang sensitif, jadi kami menjelaskan di sini apa saja yang disimpan, untuk apa, dan cara menghapusnya.
      </p>

      <h2>Data yang disimpan</h2>
      <ul>
        <li>
          <b>Dari akun Google:</b> email, nama, dan foto profil. Kami tidak menerima kata sandi Google-mu.
        </li>
        <li>
          <b>Data diri tiap profil:</b> nama panggilan, jenis kelamin, umur, tinggi, berat, tingkat aktivitas, dan tujuan. Juga riwayat berat
          setiap kali kamu mencatat timbangan.
        </li>
        <li>
          <b>Catatan makan & minum:</b> makanan, jumlah, waktu makan, tanggal, dan perkiraan gizinya. Juga makanan buatanmu dan daftar
          favorit.
        </li>
        <li>
          <b>Data pemakaian:</b> kapan kamu membuka aplikasi, fitur yang dipakai, dan kata pencarian yang tidak menemukan hasil. Ini dipakai
          untuk mengukur apakah Sekepal berguna dan makanan apa yang perlu ditambahkan.
        </li>
        <li>
          <b>Masukan</b> yang kamu kirim lewat aplikasi.
        </li>
        <li>
          <b>Foto piring (opsional, hanya kalau kamu menyetujuinya terpisah):</b> foto beserta catatan isi piringnya, untuk menguji ketepatan
          fitur pencatat dari foto sebelum fitur itu dibuat.
        </li>
      </ul>

      <h2>Untuk apa</h2>
      <ul>
        <li>Menghitung kebutuhan kalori, protein, dan porsi tangan untuk tiap profil.</li>
        <li>Menampilkan catatan, progres, dan riwayatmu di perangkat mana pun setelah masuk.</li>
        <li>Memperbaiki aplikasi berdasarkan angka pemakaian gabungan (bukan per orang) dan masukan.</li>
      </ul>
      <p>
        Data <b>tidak dijual</b>, <b>tidak dipakai untuk iklan</b>, dan tidak dibagikan ke pihak lain selain penyedia layanan yang menjalankan
        aplikasi ini: Vercel (hosting & penyimpanan foto), Neon (database), dan Google (login).
      </p>

      <h2>Siapa yang bisa melihat</h2>
      <p>
        Hanya kamu, setelah masuk dengan akun Google-mu. Pengelola Sekepal dapat mengakses database untuk perbaikan teknis dan melihat angka
        gabungan di halaman admin, tanpa menjual atau membagikannya.
      </p>

      <h2>Hakmu</h2>
      <ul>
        <li>
          <b>Melihat & mengunduh semua datamu</b>: Profil → Akun → Unduh data saya (file JSON).
        </li>
        <li>
          <b>Memperbaiki data</b>: Profil → Ubah data.
        </li>
        <li>
          <b>Mencabut persetujuan foto</b> kapan saja di Profil → Akun.
        </li>
        <li>
          <b>Menghapus akun</b>: Profil → Akun → Hapus akun. Semua profil, catatan, makanan buatan, dan foto ikut terhapus permanen.
        </li>
      </ul>

      <h2>Usia</h2>
      <p>
        Sekepal untuk usia 13 tahun ke atas. Pengguna di bawah 18 tahun sebaiknya memakai Sekepal bersama orang tua, karena kebutuhan gizi
        remaja yang masih tumbuh berbeda dari orang dewasa.
      </p>

      <h2>Bukan nasihat medis</h2>
      <p>
        Semua angka di Sekepal adalah perkiraan untuk orang dewasa sehat. Untuk ibu hamil/menyusui atau penderita diabetes, penyakit ginjal,
        jantung, dan gangguan makan, konsultasikan ke dokter atau ahli gizi.
      </p>

      <h2>Perubahan & kontak</h2>
      <p>
        Kalau kebijakan ini berubah, tanggal di atas akan diperbarui dan perubahan penting diberitahukan di aplikasi.
        {CONTACT ? (
          <>
            {" "}
            Pertanyaan atau permintaan soal data: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </>
        ) : (
          " Pertanyaan atau permintaan soal data bisa dikirim lewat menu Masukan di aplikasi."
        )}
      </p>
    </main>
  );
}
