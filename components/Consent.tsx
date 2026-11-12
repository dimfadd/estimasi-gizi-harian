"use client";

import Link from "next/link";
import { useState } from "react";
import { signOutAction } from "@/app/actions";

export default function Consent({ onAgree, email }: { onAgree: () => Promise<void>; email: string }) {
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="wrap consent">
      <div className="card consent-card">
        <h1>Sebelum mulai</h1>
        <p>Sekepal akan menyimpan data berikut di akun {email}:</p>
        <ul>
          <li>data diri tiap profil: umur, jenis kelamin, tinggi, berat, aktivitas, tujuan;</li>
          <li>catatan makan & minum dan riwayat berat;</li>
          <li>data pemakaian aplikasi, untuk memperbaiki Sekepal.</li>
        </ul>
        <p>
          Data ini hanya untuk menghitung dan menampilkan catatanmu, tidak dijual dan tidak dipakai untuk iklan. Kamu bisa mengunduh atau
          menghapus semuanya kapan saja. Detailnya ada di <Link href="/privasi">kebijakan privasi</Link>.
        </p>
        <label className="check">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          Saya berusia 13 tahun ke atas dan setuju data saya diproses seperti di atas.
        </label>
        <div className="consent-actions">
          <button
            type="button"
            className="btn primary"
            disabled={!ok || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onAgree();
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Gagal");
                setBusy(false);
              }
            }}
          >
            {busy ? "Menyimpan…" : "Setuju & lanjut"}
          </button>
          <form action={signOutAction}>
            <button type="submit" className="btn ghost">
              Keluar
            </button>
          </form>
        </div>
        {err && <div className="status err">{err}</div>}
      </div>
    </div>
  );
}
