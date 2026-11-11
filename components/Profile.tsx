"use client";

import Link from "next/link";
import { useState } from "react";
import { signOutAction } from "@/app/actions";
import type { Plan } from "@/lib/nutrition";
import { Method } from "./Results";
import { call, type Account } from "./useAccount";

const WORK = { duduk: "Banyak duduk", campuran: "Campuran", fisik: "Kerja fisik" };
const EX = ["Jarang olahraga", "Olahraga 1–2×/minggu", "Olahraga 3–4×/minggu", "Olahraga 5×+/minggu"];
const GOAL = { turun: "Turunkan berat", jaga: "Jaga berat", naik: "Naikkan berat", otot: "Bentuk otot" };

function Feedback() {
  const [text, setText] = useState("");
  const [state, setState] = useState<"" | "busy" | "ok" | string>("");
  return (
    <form
      className="card feedback"
      id="masukan"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        try {
          await call("/api/feedback", { method: "POST", json: { text, page: "profil" } });
          setText("");
          setState("ok");
        } catch (x) {
          setState(x instanceof Error ? x.message : "Gagal mengirim");
        }
      }}
    >
      <h3>Masukan untuk versi beta</h3>
      <p className="fine">Makanan yang tidak ada, angka yang terasa aneh, atau bagian yang membingungkan. Semua dibaca.</p>
      <textarea className="text-input area" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} required />
      <div className="row">
        <button type="submit" className="btn" disabled={state === "busy" || text.trim().length < 3}>
          {state === "busy" ? "Mengirim…" : "Kirim masukan"}
        </button>
        {state === "ok" && <span className="status ok">Terkirim, terima kasih.</span>}
        {state && state !== "ok" && state !== "busy" && <span className="status err">{state}</span>}
      </div>
    </form>
  );
}

function Claim({ onDone }: { onDone: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="claim"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const r = await call<{ profiles: number; logs: number }>("/api/claim", { method: "POST", json: { code } });
          setMsg({ ok: true, text: `Berhasil: ${r.profiles} profil baru dan ${r.logs} catatan makan dipindahkan ke akun ini.` });
          setCode("");
          await onDone();
        } catch (x) {
          setMsg({ ok: false, text: x instanceof Error ? x.message : "Gagal" });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label" htmlFor="claim">
        Pernah memakai Sekepal dengan kode keluarga? Pindahkan datanya ke akun ini:
      </label>
      <div className="row">
        <input
          id="claim"
          className="text-input"
          value={code}
          placeholder="kode keluarga lama"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32))}
        />
        <button type="submit" className="btn ghost" disabled={busy || code.length < 4}>
          {busy ? "Memindahkan…" : "Pindahkan"}
        </button>
      </div>
      {msg && <div className={`status ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
    </form>
  );
}

export default function Profile({ plan, account, onEdit }: { plan: Plan; account: Account; onEdit: () => void }) {
  const i = plan.input;
  const me = account.me!;
  const goal =
    i.goal === "turun" || i.goal === "naik"
      ? `${GOAL[i.goal]} ${i.changeKg} kg (${i.pace === "pelan" ? "¼" : i.pace === "sedang" ? "½" : "¾"} kg/minggu)`
      : GOAL[i.goal];
  const rows: [string, string][] = [
    ["Jenis kelamin", i.sex === "pria" ? "Pria" : "Wanita"],
    ["Umur", `${i.age} tahun`],
    ["Tinggi", `${i.heightCm} cm`],
    ["Berat", `${i.weightKg} kg`],
    ["Kegiatan", `${WORK[i.work]}, ${EX[i.exercise].toLowerCase()}`],
    ["Tujuan", goal],
    ["Makan", i.meals === 3 ? "3× sehari + camilan" : "2× sehari + camilan"],
  ];

  const removeProfile = async () => {
    if (!account.active) return;
    if (!confirm(`Hapus profil ${account.active.name} beserta semua catatan makan dan riwayat beratnya?`)) return;
    await account.deleteProfile(account.active.id);
  };

  const deleteAccount = async () => {
    const typed = prompt(`Ini menghapus akun ${me.user.email} dan SEMUA datanya secara permanen. Ketik HAPUS untuk melanjutkan.`);
    if (typed?.trim().toUpperCase() !== "HAPUS") return;
    await call("/api/me", { method: "DELETE" });
    const f = document.getElementById("signout-form") as HTMLFormElement | null;
    f?.requestSubmit();
  };

  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>Profil {i.name}</h2>
          </div>
          <div className="profile-grid">
            <div className="card profile">
              <dl>
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="row">
                <button type="button" className="btn primary" onClick={onEdit}>
                  Ubah data
                </button>
                {me.profiles.length > 1 && (
                  <button type="button" className="btn ghost" onClick={removeProfile}>
                    Hapus profil ini
                  </button>
                )}
              </div>
            </div>
            <Feedback />
          </div>
        </div>
      </section>

      <section className="section" id="akun">
        <div className="wrap">
          <div className="sec-head">
            <h2>Akun</h2>
            <p>
              Masuk sebagai <b>{me.user.email}</b>. Satu akun bisa berisi beberapa profil, misalnya untuk ayah, ibu, dan saudara.
            </p>
          </div>
          <div className="card account">
            <Claim onDone={account.reload} />
            <div className="acc-row">
              <div>
                <b>Foto piring untuk uji akurasi</b>
                <p className="fine">
                  {me.user.photo_consent_at ? "Kamu mengizinkan foto piring dipakai untuk menguji fitur foto." : "Belum diizinkan."}
                </p>
              </div>
              {me.user.photo_consent_at && (
                <button type="button" className="btn ghost small" onClick={() => account.setPhotoConsent(false)}>
                  Cabut izin
                </button>
              )}
            </div>
            <div className="acc-row">
              <div>
                <b>Unduh data saya</b>
                <p className="fine">Semua profil, catatan, dan riwayat berat dalam satu file JSON.</p>
              </div>
              <a className="btn ghost small" href="/api/me/export">
                Unduh
              </a>
            </div>
            <div className="acc-row">
              <div>
                <b>Keluar</b>
                <p className="fine">Data tetap tersimpan di akunmu.</p>
              </div>
              <form action={signOutAction} id="signout-form">
                <button type="submit" className="btn ghost small">
                  Keluar
                </button>
              </form>
            </div>
            <div className="acc-row danger">
              <div>
                <b>Hapus akun</b>
                <p className="fine">Menghapus akun dan semua datanya secara permanen.</p>
              </div>
              <button type="button" className="btn ghost small" onClick={deleteAccount}>
                Hapus akun
              </button>
            </div>
            <p className="fine">
              <Link href="/privasi">Kebijakan privasi</Link>
              {me.user.admin && (
                <>
                  {" · "}
                  <Link href="/admin">Halaman admin beta</Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <Method plan={plan} />
    </>
  );
}
