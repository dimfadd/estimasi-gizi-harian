"use client";

import { useState } from "react";
import type { PlanInput } from "@/lib/nutrition";
import { CODE_RE } from "@/lib/storage";
import type { FamilyState } from "./useFamily";

export default function Family({ fam, current, onOpen }: { fam: FamilyState; current: string; onOpen: (i: PlanInput) => void }) {
  const { code, setCode, mode, members, removeEntry } = fam;
  const [draft, setDraft] = useState(code);
  const [msg, setMsg] = useState("");
  const me = current.trim().toLowerCase();

  const share = async () => {
    const url = `${window.location.origin}/?k=${encodeURIComponent(code)}`;
    try {
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await navigator.share({ title: "Sekepal", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg("Tautan disalin. Kirim ke HP anggota keluarga lewat WhatsApp.");
    } catch {
      setMsg(url);
    }
  };

  return (
    <section className="section" id="keluarga">
      <div className="wrap">
        <div className="sec-head">
          <h2>Keluarga</h2>
          <p>Satu kode untuk satu rumah. Siapa pun yang tahu kodenya bisa melihat datanya, jadi jangan pakai nama lengkap atau tanggal lahir.</p>
        </div>
        <div className="family">
          <div className="card save-card">
            {mode === "db" ? (
              <>
                <label className="label" htmlFor="code">
                  Kode keluarga
                </label>
                <form
                  style={{ display: "flex", gap: 8 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (CODE_RE.test(draft)) setCode(draft);
                  }}
                >
                  <input
                    id="code"
                    className="text-input"
                    value={draft}
                    autoCapitalize="none"
                    spellCheck={false}
                    onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32))}
                  />
                  <button type="submit" className="btn ghost" disabled={!CODE_RE.test(draft) || draft === code}>
                    Pakai
                  </button>
                </form>
                {fam.codeValid && (
                  <button type="button" className="btn" onClick={share}>
                    Kirim tautan ke HP
                  </button>
                )}
                {msg && <div className="status ok" style={{ wordBreak: "break-all" }}>{msg}</div>}
              </>
            ) : (
              <div className="status">Database belum disambungkan, jadi data hanya tersimpan di browser ini.</div>
            )}
          </div>

          <div className="members">
            {members.length === 0 && <div className="empty">Belum ada anggota tersimpan.</div>}
            {members.map((m) => (
              <div key={m.key} className={`card member${m.key === me ? " me" : ""}`}>
                <header>
                  <h3>{m.latest.member_name}</h3>
                  <span className="meta">
                    {m.count} timbang · {new Date(m.latest.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </header>
                <div className="row">
                  <div>
                    <b>{m.latest.input.weightKg}</b>kg
                  </div>
                  <div>
                    <b>{m.latest.output.targetKcal}</b>kkal
                  </div>
                  <div>
                    <b>{m.latest.output.proteinG}</b>g protein
                  </div>
                </div>
                <div className="actions">
                  {m.key !== me && (
                    <button type="button" className="btn" onClick={() => onOpen(m.latest.input)}>
                      Buka
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={async () => {
                      if (!confirm(`Hapus timbangan terakhir ${m.latest.member_name}?`)) return;
                      if (!(await removeEntry(m.latest))) setMsg("Gagal menghapus");
                    }}
                  >
                    Hapus timbangan terakhir
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
