"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildPlan, sanitizeInput, type PlanInput } from "@/lib/nutrition";
import { CODE_KEY, CODE_RE, store, type DbMode } from "@/lib/storage";

interface Entry {
  id: number | string;
  member_name: string;
  input: PlanInput;
  output: { targetKcal: number; proteinG: number; targetWeightKg: number };
  created_at: string;
}

const LOCAL_KEY = "sekepal.entries";

function localEntries(): Entry[] {
  try {
    return JSON.parse(store.get(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function Spark({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null;
  const W = 120,
    H = 32;
  const lo = Math.min(...pts),
    hi = Math.max(...pts);
  const span = hi - lo || 1;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${((i / (pts.length - 1)) * (W - 6) + 3).toFixed(1)} ${(H - 4 - ((p - lo) / span) * (H - 8)).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label={`Riwayat berat: ${pts.join(", ")} kg`} role="img">
      <path d={d} fill="none" stroke="#C2412D" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function Family({
  input,
  onLoad,
  code,
  setCode,
  mode,
}: {
  input: PlanInput;
  onLoad: (i: PlanInput) => void;
  code: string;
  setCode: (c: string) => void;
  mode: DbMode;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);

  const load = useCallback(async (c: string) => {
    if (!CODE_RE.test(c)) {
      setEntries([]);
      return;
    }
    try {
      const res = await fetch(`/api/entries?family=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat");
      setEntries(data.entries);
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Gagal memuat" });
    }
  }, []);

  useEffect(() => {
    if (mode === "local") setEntries(localEntries());
    else if (mode === "db") load(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, load]);

  const save = async () => {
    setMsg(null);
    const clean = sanitizeInput(input);
    if (!clean || !clean.name) {
      setMsg({ kind: "err", text: "Isi nama panggilan dulu di formulir atas." });
      return;
    }
    if (mode !== "local" && !CODE_RE.test(code)) {
      setMsg({ kind: "err", text: "Kode keluarga 4–32 karakter: huruf kecil, angka, atau strip." });
      return;
    }
    setBusy(true);
    try {
      if (mode === "local") {
        const p = buildPlan(clean);
        const e: Entry = {
          id: `${Date.now()}`,
          member_name: clean.name,
          input: clean,
          output: { targetKcal: p.targetKcal, proteinG: p.proteinG, targetWeightKg: p.targetWeightKg },
          created_at: new Date().toISOString(),
        };
        const all = [e, ...localEntries()].slice(0, 300);
        store.set(LOCAL_KEY, JSON.stringify(all));
        setEntries(all);
      } else {
        store.set(CODE_KEY, code);
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ familyCode: code, input: clean }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
        setEntries((xs) => [data.entry, ...xs]);
      }
      setMsg({ kind: "ok", text: `Tersimpan untuk ${clean.name}.` });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Gagal menyimpan" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: Entry) => {
    if (!confirm(`Hapus catatan ${e.member_name} tanggal ${new Date(e.created_at).toLocaleDateString("id-ID")}?`)) return;
    if (mode === "local") {
      const all = localEntries().filter((x) => x.id !== e.id);
      store.set(LOCAL_KEY, JSON.stringify(all));
      setEntries(all);
      return;
    }
    const res = await fetch(`/api/entries?family=${encodeURIComponent(code)}&id=${e.id}`, { method: "DELETE" });
    if (res.ok) setEntries((xs) => xs.filter((x) => x.id !== e.id));
    else setMsg({ kind: "err", text: "Gagal menghapus" });
  };

  const members = useMemo(() => {
    const by = new Map<string, Entry[]>();
    for (const e of entries) {
      const k = e.member_name.trim().toLowerCase();
      by.set(k, [...(by.get(k) ?? []), e]);
    }
    return [...by.values()].map((list) => {
      const sorted = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
      return { latest: sorted[sorted.length - 1], weights: sorted.map((e) => e.input.weightKg), count: sorted.length };
    });
  }, [entries]);

  const randomCode = () => {
    const c = `keluarga-${Math.random().toString(36).slice(2, 7)}`;
    setCode(c);
    store.set(CODE_KEY, c);
    setEntries([]);
  };

  return (
    <section className="section" id="keluarga">
      <div className="wrap">
        <div className="sec-head">
          <span className="idx">08</span>
          <h2>Simpan &amp; pantau keluarga</h2>
          <p>
            Simpan tiap kali timbang (seminggu sekali cukup). Riwayat beratnya muncul di kartu masing-masing. Satu kode untuk satu rumah; siapa pun
            yang tahu kodenya bisa melihat datanya, jadi jangan pakai nama lengkap atau tanggal lahir.
          </p>
        </div>
        <div className="family">
          <div className="card save-card">
            {mode !== "local" ? (
              <div>
                <label className="label" htmlFor="code">
                  Kode keluarga
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="code"
                    className="text-input"
                    value={code}
                    placeholder="mis. rumah-cibubur"
                    onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32))}
                    onBlur={() => {
                      if (CODE_RE.test(code)) {
                        store.set(CODE_KEY, code);
                        load(code);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && CODE_RE.test(code)) {
                        store.set(CODE_KEY, code);
                        load(code);
                      }
                    }}
                  />
                  <button type="button" className="btn ghost" onClick={randomCode} title="Buat kode acak">
                    Acak
                  </button>
                </div>
              </div>
            ) : (
              <div className="status">Database belum disambungkan, jadi data hanya tersimpan di browser ini.</div>
            )}
            <button type="button" className="btn primary" onClick={save} disabled={busy}>
              {busy ? "Menyimpan…" : `Simpan data ${input.name || "ini"}`}
            </button>
            {msg && <div className={`status ${msg.kind === "ok" ? "ok" : msg.kind === "err" ? "err" : ""}`}>{msg.text}</div>}
            <p className="fine">Yang disimpan: nama panggilan, umur, tinggi, berat, aktivitas, tujuan, dan hasil hitungannya.</p>
          </div>

          <div className="members">
            {members.length === 0 && (
              <div className="empty">
                {mode === "db" && !CODE_RE.test(code)
                  ? "Isi kode keluarga untuk melihat data yang sudah tersimpan."
                  : "Belum ada data. Isi formulir untuk satu orang, tekan Simpan, lalu ganti ke anggota keluarga berikutnya."}
              </div>
            )}
            {members.map(({ latest, weights, count }) => (
              <div key={latest.id} className="card member">
                <header>
                  <h3>{latest.member_name}</h3>
                  <span className="meta">
                    {count} catatan · {new Date(latest.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </header>
                <div className="row">
                  <div>
                    <b>{latest.input.weightKg}</b>kg
                  </div>
                  <div>
                    <b>{latest.output.targetKcal}</b>kkal
                  </div>
                  <div>
                    <b>{latest.output.proteinG}</b>g protein
                  </div>
                </div>
                <Spark pts={weights} />
                <div className="actions">
                  <button type="button" className="btn" onClick={() => onLoad(latest.input)}>
                    Buka
                  </button>
                  <button type="button" className="btn ghost" onClick={() => remove(latest)}>
                    Hapus terakhir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
