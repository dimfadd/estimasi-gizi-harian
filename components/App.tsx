"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { bmiCategory, bmiOf, bodyFatEstimate, buildPlan, sanitizeInput, type PlanInput } from "@/lib/nutrition";
import type { BodyShape } from "./Body3D";
import Family from "./Family";
import Form from "./Form";
import { Daily, HandGuide, Journey, Meals, Method, Snacks } from "./Results";

const Body3D = dynamic(() => import("./Body3D"), {
  ssr: false,
  loading: () => <div className="body-canvas" />,
});

const DEFAULT: PlanInput = {
  name: "",
  sex: "pria",
  age: 30,
  heightCm: 165,
  weightKg: 65,
  work: "duduk",
  exercise: 1,
  goal: "jaga",
  changeKg: 5,
  pace: "sedang",
  meals: 3,
};

const DRAFT_KEY = "sekepal.draft";

export default function App() {
  const [input, setInput] = useState<PlanInput>(DEFAULT);
  const [t, setT] = useState(0);
  const loaded = useRef(false);

  // ingat isian terakhir di browser ini
  useEffect(() => {
    try {
      const saved = sanitizeInput(JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"));
      if (saved) setInput(saved);
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(input));
    } catch {}
  }, [input]);

  const plan = useMemo(() => buildPlan(input), [input]);

  const now: BodyShape = { sex: input.sex, heightCm: input.heightCm, bmi: plan.bmi, bodyFatPct: plan.bodyFatPct };
  const targetBmi = bmiOf(plan.targetWeightKg, input.heightCm);
  const target: BodyShape = {
    ...now,
    bmi: targetBmi,
    bodyFatPct:
      plan.mode === "rekomposisi"
        ? plan.bodyFatPct - 5
        : input.goal === "otot"
          ? plan.bodyFatPct - 1
          : bodyFatEstimate(targetBmi, input.age, input.sex),
  };
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const shape: BodyShape = {
    ...now,
    bmi: lerp(now.bmi, target.bmi),
    bodyFatPct: lerp(now.bodyFatPct, target.bodyFatPct),
  };
  const shownWeight = lerp(input.weightKg, plan.targetWeightKg);

  const set = (patch: Partial<PlanInput>) => setInput((s) => ({ ...s, ...patch }));
  const loadMember = (i: PlanInput) => {
    setInput(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
              <path d="M8 50 q0 -34 24 -36 q24 2 24 36 q-24 7 -48 0 z" fill="#FFFDF6" stroke="#26261F" strokeWidth="4" strokeLinejoin="round" />
              <path d="M22 34 q3 -2 6 0 M34 28 q3 -2 6 0 M30 42 q3 -2 6 0" stroke="#C2412D" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            </svg>
            Sekepal
            <small>takaran makan pakai tangan sendiri</small>
          </div>
          <nav aria-label="Bagian">
            <a href="#jatah">Jatah</a>
            <a href="#piring">Isi piring</a>
            <a href="#camilan">Camilan</a>
            <a href="#keluarga">Keluarga</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="section">
          <div className="wrap">
            <div className="sec-head">
              <span className="idx">01</span>
              <h2>{input.name ? `Data ${input.name}` : "Data diri"}</h2>
              <p>Hasil di bawah langsung berubah saat kamu mengisi. Tidak perlu timbangan dapur atau meteran.</p>
            </div>
            <div className="hero">
              <Form input={input} set={set} recomposition={plan.mode === "rekomposisi"} />

              <div className="card body-panel">
                <div className="body-canvas">
                  <Body3D shape={shape} />
                  <span className="tag">
                    {t < 0.02 ? "sekarang" : t > 0.98 ? "target" : "menuju target"} · {shownWeight.toFixed(1).replace(".", ",")} kg
                  </span>
                </div>
                <div className="body-ctrl">
                  <label className="morph">
                    <span>Sekarang</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={t}
                      onChange={(e) => setT(Number(e.target.value))}
                      aria-label="Geser dari bentuk sekarang ke target"
                    />
                    <span>Target</span>
                  </label>
                  <div className="stats">
                    <div className="stat">
                      <b>{shape.bmi.toFixed(1).replace(".", ",")}</b>
                      <span>BMI · {bmiCategory(shape.bmi)}</span>
                    </div>
                    <div className="stat">
                      <b>±{Math.round(shape.bodyFatPct)}%</b>
                      <span>perkiraan lemak tubuh</span>
                    </div>
                    <div className="stat">
                      <b>{plan.targetWeightKg.toFixed(1).replace(".", ",")}</b>
                      <span>kg berat target</span>
                    </div>
                  </div>
                  <p className="fine">Bentuk 3D diperkirakan dari BMI dan umur, bukan hasil pindai. Geser untuk melihat perkiraan bentuk di berat target.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Daily plan={plan} />
        <HandGuide plan={plan} />
        <Meals plan={plan} />
        <Snacks plan={plan} />
        <Journey plan={plan} />
        <Family input={input} onLoad={loadMember} />
        <Method plan={plan} />
      </main>

      <footer className="foot">
        <div className="wrap">
          Sekepal memberi perkiraan untuk orang dewasa sehat. Untuk ibu hamil/menyusui, penderita diabetes, ginjal, atau jantung, konsultasikan
          angka ini ke dokter atau ahli gizi.
        </div>
      </footer>
    </>
  );
}
