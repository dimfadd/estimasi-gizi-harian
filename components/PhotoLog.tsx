"use client";

import { useRef, useState } from "react";
import { LOG_BY_ID, nutrientsOf, SWEET_LEVELS, type Sweet } from "@/lib/log";
import { FoodIcon } from "./art";
import type { NewRow } from "./FoodPicker";
import { Stepper } from "./Form";
import { ProBadge } from "./Pro";
import { n0 } from "./TrackerParts";

interface DraftItem extends NewRow {
  confidence: "tinggi" | "sedang" | "rendah";
  seenAs: string;
  key: number;
}

interface Draft {
  draftId: string;
  items: DraftItem[];
  unlisted: { name: string; kcal: number }[];
  questions: string[];
  note: string;
  left: number;
}

/** Kecilkan foto di browser sebelum diunggah. */
export async function compressPhoto(file: File, max = 1280): Promise<Blob> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal memproses foto"))), "image/jpeg", 0.82));
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

export default function PhotoLog({
  pro,
  enabled,
  profileId,
  handScale,
  slotLabel,
  onSave,
  onUpsell,
}: {
  pro: boolean;
  enabled: boolean;
  profileId: string;
  handScale: number;
  slotLabel: string;
  onSave: (rows: NewRow[], draftId: string) => Promise<boolean>;
  onUpsell: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  if (!pro)
    return (
      <button type="button" className="btn ghost small btn-pro" onClick={onUpsell}>
        <CameraIcon /> Foto makanan <ProBadge />
      </button>
    );
  if (!enabled) return null;

  const read = async (file: File) => {
    setBusy(true);
    setErr("");
    setDraft(null);
    try {
      const blob = await compressPhoto(file);
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.set("photo", new File([blob], "makan.jpg", { type: "image/jpeg" }));
      fd.set("profile", profileId);
      const res = await fetch("/api/photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal membaca foto");
      setDraft({ ...data, items: (data.items as Omit<DraftItem, "key">[]).map((x, i) => ({ ...x, key: i })) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membaca foto");
    } finally {
      setBusy(false);
    }
  };

  const patch = (key: number, p: Partial<DraftItem>) =>
    setDraft((d) => (d ? { ...d, items: d.items.map((x) => (x.key === key ? { ...x, ...p } : x)) } : d));
  const drop = (key: number) => setDraft((d) => (d ? { ...d, items: d.items.filter((x) => x.key !== key) } : d));

  const total = draft
    ? draft.items.reduce((s, x) => s + (nutrientsOf(LOG_BY_ID[x.foodId], x.amount, handScale, x.fried, (x.sweet ?? 0) as Sweet)?.kcal ?? 0), 0)
    : 0;

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) read(f);
          e.target.value = "";
        }}
      />
      <button type="button" className="btn small btn-pro photo-btn" onClick={() => input.current?.click()} disabled={busy}>
        <CameraIcon /> {busy ? "AI membaca foto…" : "Foto makanan"}
      </button>
      {err && <div className="status err photo-err">{err}</div>}

      {(busy || draft) && (
        <div className="photo-draft">
          {preview && <img src={preview} alt="Foto makanan" />}
          {busy && <p className="fine">Mengenali makanan dan memperkirakan porsinya…</p>}
          {draft && (
            <div className="pd-body">
              <p className="pd-note">{draft.note}</p>
              {draft.items.length === 0 && <p className="fine">Tidak ada makanan yang dikenali. Coba foto dari atas dengan cahaya cukup.</p>}
              <ul className="pd-items">
                {draft.items.map((x) => {
                  const it = LOG_BY_ID[x.foodId];
                  if (!it) return null;
                  return (
                    <li key={x.key}>
                      <FoodIcon id={it.icon} size={34} />
                      <div className="pd-main">
                        <div className="pd-name">
                          <b>{it.name}</b>
                          <span className={`conf ${x.confidence}`}>{x.confidence === "tinggi" ? "yakin" : x.confidence === "sedang" ? "cukup yakin" : "ragu"}</span>
                        </div>
                        <div className="pd-ctl">
                          <Stepper
                            id={`pd-${x.key}`}
                            value={x.amount}
                            min={it.step}
                            max={20}
                            step={it.step}
                            unit={it.unit}
                            onChange={(v) => patch(x.key, { amount: v })}
                          />
                          {it.fryable && (
                            <label className="check">
                              <input type="checkbox" checked={x.fried} onChange={(e) => patch(x.key, { fried: e.target.checked })} />
                              goreng
                            </label>
                          )}
                          {it.sweetable && (
                            <select
                              className="text-input pd-sweet"
                              value={x.sweet ?? 0}
                              aria-label="Tingkat manis"
                              onChange={(e) => patch(x.key, { sweet: Number(e.target.value) as Sweet })}
                            >
                              {SWEET_LEVELS.map((l) => (
                                <option key={l.v} value={l.v}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                      <button type="button" className="x" aria-label={`Hapus ${it.name}`} onClick={() => drop(x.key)}>
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
              {draft.questions.length > 0 && (
                <ul className="pd-q">
                  {draft.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              )}
              {draft.unlisted.length > 0 && (
                <p className="fine">
                  Belum ada di daftar: {draft.unlisted.map((u) => `${u.name} (±${Math.round(u.kcal)} kkal)`).join(", ")}. Tambahkan lewat pencarian →
                  makanan buatanku.
                </p>
              )}
              <div className="pd-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={saving || draft.items.length === 0}
                  onClick={async () => {
                    setSaving(true);
                    const ok = await onSave(
                      draft.items.map(({ foodId, amount, fried, sweet }) => ({ foodId, amount, fried, sweet })),
                      draft.draftId,
                    );
                    setSaving(false);
                    if (ok) {
                      setDraft(null);
                      setPreview("");
                    }
                  }}
                >
                  {saving ? "Menyimpan…" : `Simpan ke ${slotLabel} · ${n0(total)} kkal`}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setDraft(null);
                    setPreview("");
                  }}
                >
                  Batal
                </button>
              </div>
              <p className="fine">Sisa {draft.left} foto hari ini. Perkiraan dari foto bisa meleset; minyak, santan, dan gula tidak terlihat.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
