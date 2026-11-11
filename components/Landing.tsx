import Link from "next/link";
import { signInDev, signInGoogle } from "@/app/actions";
import { FoodIcon, HandIcon } from "./art";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Landing({ devLogin }: { devLogin: boolean }) {
  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <FoodIcon id="nasi_putih" size={30} />
            Sekepal <span className="beta">beta</span>
          </div>
        </div>
      </header>
      <main className="landing">
        <section className="wrap lp-hero">
          <div>
            <h1>Takaran makan pakai tangan sendiri.</h1>
            <p className="lp-lead">
              Isi tinggi, berat, dan tujuanmu. Sekepal menghitung jatah harian dalam kepal nasi, telapak lauk, dan ruas ibu jari minyak. Setelah
              itu tinggal catat yang kamu makan, tanpa timbangan.
            </p>
            <form action={signInGoogle}>
              <button type="submit" className="btn google">
                <GoogleG /> Masuk dengan Google
              </button>
            </form>
            <p className="fine lp-fine">
              Gratis selama beta. Datamu hanya bisa dilihat olehmu. <Link href="/privasi">Kebijakan privasi</Link>
            </p>
            {devLogin && (
              <form action={signInDev} className="dev-login">
                <input name="email" className="text-input" defaultValue="uji@dev.local" aria-label="Email uji" />
                <button type="submit" className="btn ghost">
                  Masuk (uji lokal)
                </button>
              </form>
            )}
          </div>
          <div className="lp-hands" aria-hidden>
            {(
              [
                ["kepal", "1 kepal", "nasi, kentang, sayur"],
                ["telapak", "1 telapak", "ayam, ikan, tempe"],
                ["ibu jari", "1 ruas ibu jari", "minyak, santan"],
                ["genggam", "1 genggam", "oat, kacang"],
              ] as const
            ).map(([k, t, d]) => (
              <div key={k} className="card lp-hand">
                <HandIcon kind={k} size={64} />
                <b>{t}</b>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap lp-steps">
          {[
            ["sayur", "Hitung sekali", "Kebutuhan kalori, protein, dan serat dihitung dari data dirimu, lalu dibagi ke sarapan, siang, malam, dan camilan."],
            ["piring_isi", "Catat dalam hitungan detik", "Cari dari 250+ makanan Indonesia, dari nasi padang sampai es kopi susu. Yang sering dimakan muncul paling atas."],
            ["kopi_susu", "Lihat yang sering terlewat", "Gula dari minuman manis, air putih, dan minyak dari gorengan ikut terhitung."],
          ].map(([icon, t, d]) => (
            <div key={t} className="lp-step">
              <FoodIcon id={icon} size={48} />
              <h2>{t}</h2>
              <p>{d}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="foot">
        <div className="wrap">
          Angka di Sekepal adalah perkiraan untuk orang dewasa sehat, bukan nasihat medis. · <Link href="/privasi">Privasi</Link>
        </div>
      </footer>
    </>
  );
}
