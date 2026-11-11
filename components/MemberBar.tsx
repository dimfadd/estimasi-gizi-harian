"use client";

import { useState } from "react";
import { CODE_RE } from "@/lib/storage";
import type { PlanInput } from "@/lib/nutrition";
import type { FamilyState } from "./useFamily";

export default function MemberBar({
  fam,
  current,
  onPick,
  onNew,
}: {
  fam: FamilyState;
  current: string;
  onPick: (i: PlanInput) => void;
  onNew: () => void;
}) {
  const { mode, code, setCode, members, loading, error, codeValid } = fam;
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState("");

  if (mode === "unknown") return null;

  const shareLink = async () => {
    const url = `${window.location.origin}/?k=${encodeURIComponent(code)}`;
    try {
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await navigator.share({ title: "Sekepal", text: "Buka data keluarga kita di Sekepal", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied("Tautan disalin. Kirim ke HP lewat WhatsApp, lalu buka.");
    } catch {
      setCopied(url);
    }
    setTimeout(() => setCopied(""), 6000);
  };

  const openCode = (c: string) => {
    const v = c.trim().toLowerCase();
    if (!CODE_RE.test(v)) return;
    setCode(v);
    setEditing(false);
    setDraft("");
  };

  const needCode = mode === "db" && (!codeValid || editing);
  const me = current.trim().toLowerCase();

  return (
    <div className="member-bar">
      <div className="wrap">
        {needCode ? (
          <form
            className="mb-code"
            onSubmit={(e) => {
              e.preventDefault();
              openCode(draft);
            }}
          >
            <label htmlFor="mb-code">Sudah pernah menyimpan di HP/laptop lain? Masukkan kode keluarga:</label>
            <div className="mb-code-in">
              <input
                id="mb-code"
                className="text-input"
                value={draft}
                placeholder="mis. dimfad"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32))}
              />
              <button type="submit" className="btn" disabled={!CODE_RE.test(draft)}>
                Buka
              </button>
              {editing && (
                <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                  Batal
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="mb-row">
            <div className="mb-chips" role="group" aria-label="Pilih anggota keluarga">
              {members.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className="chip"
                  aria-pressed={m.key === me}
                  onClick={() => onPick(m.latest.input)}
                  title={`${m.latest.input.weightKg} kg · ${m.latest.output.targetKcal} kkal`}
                >
                  <span className="av" aria-hidden>
                    {m.latest.member_name.trim().charAt(0).toUpperCase()}
                  </span>
                  {m.latest.member_name}
                </button>
              ))}
              {me && !members.some((m) => m.key === me) && (
                <button type="button" className="chip" aria-pressed title="Belum disimpan">
                  <span className="av" aria-hidden>
                    {current.trim().charAt(0).toUpperCase()}
                  </span>
                  {current.trim()}
                </button>
              )}
              <button type="button" className="chip add" onClick={onNew}>
                + Orang baru
              </button>
              {loading && <span className="mb-note">memuat…</span>}
              {!loading && members.length === 0 && !me && (
                <span className="mb-note">
                  {mode === "db" ? `Belum ada anggota tersimpan dengan kode "${code}".` : "Belum ada anggota tersimpan di browser ini."}
                </span>
              )}
            </div>
            {mode === "db" && (
              <div className="mb-tools">
                <span className="mb-note">
                  kode <b className="num">{code}</b>
                </span>
                <button type="button" className="linkish" onClick={shareLink}>
                  kirim ke HP
                </button>
                <button type="button" className="linkish" onClick={() => setEditing(true)}>
                  ganti
                </button>
              </div>
            )}
          </div>
        )}
        {error && <div className="status err" style={{ marginTop: 8 }}>{error}</div>}
        {copied && <div className="status ok" style={{ marginTop: 8, wordBreak: "break-all" }}>{copied}</div>}
      </div>
    </div>
  );
}
