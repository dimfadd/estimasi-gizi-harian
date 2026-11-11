"use client";

import { useState } from "react";
import { fmtAmount, type Plan, type PlanInput } from "@/lib/nutrition";
import BodyPanel from "./BodyPanel";
import Form from "./Form";

const nf = new Intl.NumberFormat("id-ID");

export default function Setup({
  plan,
  set,
  editing,
  onSave,
  onCancel,
}: {
  plan: Plan;
  set: (p: Partial<PlanInput>) => void;
  editing: boolean;
  onSave: () => Promise<string | null>;
  onCancel?: () => void;
}) {
  const { input } = plan;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    const e = await onSave();
    setBusy(false);
    if (e) setErr(e);
  };

  return (
    <section className="section setup">
      <div className="wrap">
        <div className="sec-head">
          <h2>{editing ? `Ubah data ${input.name}` : input.name ? `Data ${input.name}` : "Data diri"}</h2>
          <p>
            {editing
              ? "Ubah yang perlu saja, lalu simpan. Berat baru tercatat ke riwayat."
              : "Cukup diisi sekali. Setelah disimpan, yang tampil sehari-hari hanya jatah makan dan catatan makan."}
          </p>
        </div>
        <div className="hero">
          <Form input={input} set={set} recomposition={plan.mode === "rekomposisi"} />
          <div className="setup-side">
            <div className="card preview-card">
              <span className="label">Hasilnya</span>
              <div className="pv-kcal">
                <b className="num">{nf.format(plan.targetKcal)}</b> kkal/hari
              </div>
              <div className="pv-row">
                <span>
                  <b className="num">{fmtAmount(plan.daily.carbFists)}</b> kepal nasi
                </span>
                <span>
                  <b className="num">{fmtAmount(plan.daily.proteinPalms)}</b> telapak lauk
                </span>
                <span>
                  <b className="num">{fmtAmount(plan.daily.vegFists)}</b> kepal sayur
                </span>
              </div>
              {plan.notes.length > 0 && (
                <ul className="notes">
                  {plan.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
              <div className="setup-actions">
                <button type="button" className="btn primary" onClick={save} disabled={busy || !input.name.trim()}>
                  {busy ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan & mulai"}
                </button>
                {onCancel && (
                  <button type="button" className="btn ghost" onClick={onCancel}>
                    Batal
                  </button>
                )}
              </div>
              {!input.name.trim() && <p className="fine">Isi nama panggilan dulu.</p>}
              {err && <div className="status err">{err}</div>}
            </div>
            <BodyPanel plan={plan} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
