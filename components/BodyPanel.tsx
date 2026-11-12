"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { bmiCategory, bmiOf, bodyFatEstimate, type Plan } from "@/lib/nutrition";
import type { BodyShape } from "./Mannequin3D";

const Mannequin3D = dynamic(() => import("./Mannequin3D"), {
  ssr: false,
  loading: () => <div className="body-canvas" />,
});

const c1 = (x: number) => x.toFixed(1).replace(".", ",");

export default function BodyPanel({ plan, compact }: { plan: Plan; compact?: boolean }) {
  const { input } = plan;
  const [t, setT] = useState(0);
  const now: BodyShape = { sex: input.sex, heightCm: input.heightCm, bmi: plan.bmi, bodyFatPct: plan.bodyFatPct };
  const targetBmi = bmiOf(plan.targetWeightKg, input.heightCm);
  const targetFat =
    plan.mode === "rekomposisi"
      ? plan.bodyFatPct - 5
      : input.goal === "otot"
        ? plan.bodyFatPct - 1
        : bodyFatEstimate(targetBmi, input.age, input.sex);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const shape: BodyShape = { ...now, bmi: lerp(now.bmi, targetBmi), bodyFatPct: lerp(now.bodyFatPct, targetFat) };

  return (
    <div className={`card body-panel${compact ? " compact" : ""}`}>
      <div className="body-canvas">
        <Mannequin3D shape={shape} autoRotate />
        <span className="tag">
          {t < 0.02 ? "sekarang" : t > 0.98 ? "target" : "menuju target"} · {c1(lerp(input.weightKg, plan.targetWeightKg))} kg
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
            <b>{c1(shape.bmi)}</b>
            <span>BMI · {bmiCategory(shape.bmi)}</span>
          </div>
          <div className="stat">
            <b>±{Math.round(shape.bodyFatPct)}%</b>
            <span>perkiraan lemak tubuh</span>
          </div>
          <div className="stat">
            <b>{c1(plan.targetWeightKg)}</b>
            <span>kg berat target</span>
          </div>
        </div>
        {!compact && <p className="fine">Bentuk 3D diperkirakan dari BMI dan umur, bukan hasil pindai.</p>}
      </div>
    </div>
  );
}
