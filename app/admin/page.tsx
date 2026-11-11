import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { dbEnabled } from "@/lib/db";
import { FOOD_BY_ID } from "@/lib/fooddb";
import { isAdminEmail } from "@/lib/server/session";
import { betaStats } from "@/lib/server/stats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin beta · Sekepal", robots: { index: false } };

const nf = new Intl.NumberFormat("id-ID");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export default async function AdminPage() {
  const s = await auth();
  if (!dbEnabled || !isAdminEmail(s?.user?.email)) notFound();
  const st = await betaStats();
  const maxActive = Math.max(1, ...st.daily.map((d) => d.active));

  return (
    <main className="wrap admin">
      <p style={{ marginTop: 20 }}>
        <a href="/">← Kembali ke Sekepal</a>
      </p>
      <div className="sec-head">
        <h2>Beta — angka utama</h2>
        <p>Yang menentukan apakah Sekepal layak dilanjutkan ke Pro: retensi H+7 dan H+30, bukan jumlah pendaftar.</p>
      </div>

      <div className="adm-kpis">
        {[
          ["Pengguna", st.totals.users],
          ["Setuju privasi", st.totals.consented],
          ["Aktif hari ini", st.totals.dau],
          ["Aktif 7 hari", st.totals.wau],
          ["Aktif 30 hari", st.totals.mau],
          ["Total catatan", st.totals.logs],
        ].map(([k, v]) => (
          <div key={k as string} className="card stat-card">
            <span>{k}</span>
            <b className="num">{nf.format(v as number)}</b>
          </div>
        ))}
      </div>

      <div className="adm-grid">
        <section className="card adm-card">
          <h3>Retensi</h3>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Jendela</th>
                <th className="num">Kembali</th>
                <th className="num">Dari</th>
                <th className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {st.retention.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num">{r.kept}</td>
                  <td className="num">{r.eligible}</td>
                  <td className="num">
                    <b>{pct(r.kept, r.eligible)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fine">
            Rata-rata <b className="num">{st.logsPerActiveDay.toFixed(1).replace(".", ",")}</b> catatan per profil per hari aktif (30 hari).
          </p>
        </section>

        <section className="card adm-card">
          <h3>Aktif per hari (30 hari)</h3>
          <div className="adm-bars" role="img" aria-label="Pengguna aktif per hari">
            {st.daily.map((d) => (
              <div key={d.day} title={`${d.day}: ${d.active} aktif, ${d.signups} daftar, ${d.logs} catatan`}>
                <i style={{ height: `${(d.active / maxActive) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="fine">
            Daftar 30 hari: <b className="num">{nf.format(st.daily.reduce((a, d) => a + d.signups, 0))}</b> · catatan 30 hari:{" "}
            <b className="num">{nf.format(st.daily.reduce((a, d) => a + d.logs, 0))}</b>
          </p>
        </section>

        <section className="card adm-card">
          <h3>Dicari tapi tidak ada</h3>
          <p className="fine">Daftar ini yang perlu ditambahkan ke database makanan.</p>
          <table className="adm-table">
            <tbody>
              {st.misses.length === 0 && (
                <tr>
                  <td>Belum ada.</td>
                </tr>
              )}
              {st.misses.map((m) => (
                <tr key={m.q}>
                  <td>{m.q}</td>
                  <td className="num">{m.n}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card adm-card">
          <h3>Paling sering dicatat</h3>
          <table className="adm-table">
            <tbody>
              {st.topFoods.map((f) => (
                <tr key={f.id}>
                  <td>{FOOD_BY_ID[f.id]?.name ?? (f.id.startsWith("u:") ? "Makanan buatan" : f.id)}</td>
                  <td className="num">{nf.format(f.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card adm-card">
          <h3>Tujuan profil</h3>
          <table className="adm-table">
            <tbody>
              {st.goals.map((g) => (
                <tr key={g.goal}>
                  <td>{g.goal}</td>
                  <td className="num">{g.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ marginTop: 16 }}>Sampel foto</h3>
          <p>
            <b className="num">{st.samples.n}</b> foto dari <b className="num">{st.samples.users}</b> pengguna.{" "}
            {st.samples.n > 0 && <a href="/api/admin/samples">Unduh label (JSON)</a>}
          </p>
        </section>

        <section className="card adm-card wide">
          <h3>Masukan terbaru</h3>
          {st.feedback.length === 0 && <p className="fine">Belum ada masukan.</p>}
          <ul className="adm-feedback">
            {st.feedback.map((f, i) => (
              <li key={i}>
                <p>{f.text}</p>
                <span className="fine">
                  {f.email} · {f.page} · {new Date(f.at).toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
