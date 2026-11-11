"use client";

import type { Profile } from "./useAccount";

export default function ProfileBar({
  profiles,
  activeId,
  onPick,
  onNew,
  disabled,
}: {
  profiles: Profile[];
  activeId: string;
  onPick: (id: string) => void;
  onNew: () => void;
  disabled?: boolean;
}) {
  if (profiles.length === 0) return null;
  return (
    <div className="member-bar">
      <div className="wrap">
        <div className="mb-row">
          <div className="mb-chips" role="group" aria-label="Pilih profil">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip"
                aria-pressed={!disabled && p.id === activeId}
                onClick={() => onPick(p.id)}
                title={`${p.input.weightKg} kg`}
              >
                <span className="av" aria-hidden>
                  {p.name.trim().charAt(0).toUpperCase()}
                </span>
                {p.name}
              </button>
            ))}
            {profiles.length < 10 && (
              <button type="button" className="chip add" onClick={onNew}>
                + Profil keluarga
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
