"use client";

import type { Plan, PlanInput } from "@/lib/nutrition";
import Family from "./Family";
import { Method } from "./Results";
import type { FamilyState } from "./useFamily";

const WORK = { duduk: "Banyak duduk", campuran: "Campuran", fisik: "Kerja fisik" };
const EX = ["Jarang olahraga", "Olahraga 1–2×/minggu", "Olahraga 3–4×/minggu", "Olahraga 5×+/minggu"];
const GOAL = { turun: "Turunkan berat", jaga: "Jaga berat", naik: "Naikkan berat", otot: "Bentuk otot" };

export default function Profile({
  plan,
  fam,
  onEdit,
  onOpen,
}: {
  plan: Plan;
  fam: FamilyState;
  onEdit: () => void;
  onOpen: (i: PlanInput) => void;
}) {
  const i = plan.input;
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
  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>Profil {i.name}</h2>
          </div>
          <div className="card profile">
            <dl>
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="btn primary" onClick={onEdit}>
              Ubah data
            </button>
          </div>
        </div>
      </section>
      <Family fam={fam} current={i.name} onOpen={onOpen} />
      <Method plan={plan} />
    </>
  );
}
