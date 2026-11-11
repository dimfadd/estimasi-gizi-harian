"use client";

import { useEffect, useState } from "react";
import type { Exercise, Goal, Pace, PlanInput, Work } from "@/lib/nutrition";
import { ActivityIcon, GoalIcon } from "./art";

function Stepper({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  // teks lokal supaya bisa mengetik bebas (mis. menghapus semua angka) tanpa langsung ditolak
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = (raw: string) => {
    const n = Number(raw.replace(",", "."));
    if (Number.isFinite(n) && raw.trim() !== "") onChange(Math.min(max, Math.max(min, n)));
    else setText(String(value));
  };
  const bump = (d: number) => onChange(Math.min(max, Math.max(min, Math.round((value + d) * 10) / 10)));

  return (
    <div className="stepper">
      <button type="button" aria-label="kurangi" onClick={() => bump(-step)}>
        −
      </button>
      <input
        id={id}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value.replace(",", "."));
          if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
        }}
        onBlur={(e) => commit(e.target.value)}
      />
      {unit && <span className="unit">{unit}</span>}
      <button type="button" aria-label="tambah" onClick={() => bump(step)}>
        +
      </button>
    </div>
  );
}

function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

const WORKS: { v: Work; t: string; d: string }[] = [
  { v: "duduk", t: "Banyak duduk", d: "Kantor, laptop, sopir, kasir" },
  { v: "campuran", t: "Campuran", d: "Guru, perawat, jualan, IRT aktif" },
  { v: "fisik", t: "Kerja fisik", d: "Tukang, petani, kurir motor-jalan" },
];

const GOALS: { v: Goal; t: string; d: string }[] = [
  { v: "turun", t: "Turunkan berat", d: "Kurangi lemak" },
  { v: "jaga", t: "Jaga berat", d: "Pertahankan" },
  { v: "naik", t: "Naikkan berat", d: "Terlalu kurus" },
  { v: "otot", t: "Bentuk otot", d: "Rutin latihan beban" },
];

const PACES: Record<"turun" | "naik", [Pace, string][]> = {
  turun: [
    ["pelan", "Santai ¼ kg"],
    ["sedang", "Sedang ½ kg"],
    ["cepat", "Cepat ¾ kg"],
  ],
  naik: [
    ["pelan", "Santai ¼ kg"],
    ["sedang", "Sedang ½ kg"],
    ["cepat", "Cepat ¾ kg"],
  ],
};

export default function Form({
  input,
  set,
  recomposition,
}: {
  input: PlanInput;
  set: (patch: Partial<PlanInput>) => void;
  recomposition: boolean;
}) {
  return (
    <form className="card form" onSubmit={(e) => e.preventDefault()} aria-label="Data diri">
      <div className="field-row">
        <div>
          <label className="label" htmlFor="name">
            Nama panggilan
          </label>
          <input
            id="name"
            className="text-input"
            value={input.name}
            maxLength={40}
            placeholder="mis. Ayah"
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <div>
          <span className="label">Jenis kelamin</span>
          <Seg
            label="Jenis kelamin"
            value={input.sex}
            options={[
              ["pria", "Pria"],
              ["wanita", "Wanita"],
            ]}
            onChange={(sex) => set({ sex })}
          />
        </div>
        <div>
          <label className="label" htmlFor="age">
            Umur
          </label>
          <Stepper id="age" value={input.age} min={13} max={90} unit="th" onChange={(age) => set({ age })} />
        </div>
      </div>

      <div className="field-row">
        <div>
          <label className="label" htmlFor="h">
            Tinggi badan
          </label>
          <Stepper id="h" value={input.heightCm} min={120} max={220} unit="cm" onChange={(heightCm) => set({ heightCm })} />
        </div>
        <div>
          <label className="label" htmlFor="w">
            Berat badan
          </label>
          <Stepper id="w" value={input.weightKg} min={30} max={250} step={0.5} unit="kg" onChange={(weightKg) => set({ weightKg })} />
        </div>
        <div>
          <span className="label">
            Makan besar <span className="hint">(2× = tanpa sarapan)</span>
          </span>
          <Seg
            label="Makan sehari"
            value={input.meals}
            options={[
              [3, "3×"],
              [2, "2×"],
            ]}
            onChange={(meals) => set({ meals })}
          />
        </div>
      </div>

      <div>
        <span className="label">Kegiatan sehari-hari (di luar olahraga)</span>
        <div className="choice-grid" role="group" aria-label="Kegiatan sehari-hari">
          {WORKS.map((w) => (
            <button key={w.v} type="button" className="choice" aria-pressed={input.work === w.v} onClick={() => set({ work: w.v })}>
              <ActivityIcon kind={w.v} size={36} />
              <strong>{w.t}</strong>
              <span>{w.d}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">
          Olahraga per minggu <span className="hint">— gym, futsal, lari, bersepeda ≥ 30 menit</span>
        </span>
        <Seg<Exercise>
          label="Olahraga per minggu"
          value={input.exercise}
          options={[
            [0, "Jarang"],
            [1, "1–2×"],
            [2, "3–4×"],
            [3, "5× atau lebih"],
          ]}
          onChange={(exercise) => set({ exercise })}
        />
      </div>

      <div>
        <span className="label">Tujuan</span>
        <div className="choice-grid four" role="group" aria-label="Tujuan">
          {GOALS.map((g) => (
            <button key={g.v} type="button" className="choice" aria-pressed={input.goal === g.v} onClick={() => set({ goal: g.v })}>
              <GoalIcon kind={g.v} size={36} />
              <strong>{g.t}</strong>
              <span>{g.d}</span>
            </button>
          ))}
        </div>

        {(input.goal === "turun" || input.goal === "naik") && (
          <div className="goal-extra">
            <div>
              <label className="label" htmlFor="chg">
                {input.goal === "turun" ? "Turun berapa?" : "Naik berapa?"}
              </label>
              <Stepper id="chg" value={input.changeKg} min={0} max={80} unit="kg" onChange={(changeKg) => set({ changeKg })} />
            </div>
            <div>
              <span className="label">Kecepatan per minggu</span>
              <Seg label="Kecepatan" value={input.pace} options={PACES[input.goal]} onChange={(pace) => set({ pace })} />
            </div>
          </div>
        )}
        {input.goal === "otot" && !recomposition && (
          <div className="goal-extra" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <span className="label">Kelebihan kalori</span>
              <Seg
                label="Kelebihan kalori"
                value={input.pace}
                options={[
                  ["pelan", "+200 kkal (lebih bersih)"],
                  ["sedang", "+300 kkal"],
                  ["cepat", "+450 kkal"],
                ]}
                onChange={(pace) => set({ pace })}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
