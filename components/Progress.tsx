"use client";

import { useEffect, useState } from "react";
import type { Plan, PlanInput } from "@/lib/nutrition";
import BodyPanel from "./BodyPanel";
import { Stepper } from "./Form";
import { Journey } from "./Results";
import { call } from "./useAccount";

const c1 = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function History({ points }: { points: { date: string; kg: number }[] }) {
  if (points.length < 2)
    return <p className="fine">Riwayat berat muncul setelah timbangan kedua. Timbang seminggu sekali di jam yang sama.</p>;
  const W = 600,
    H = 170,
    L = 40,
    R = 14,
    T = 14,
    B = 26;
  const ks = points.map((p) => p.kg);
  const lo = Math.min(...ks) - 1,
    hi = Math.max(...ks) + 1;
  const x = (i: number) => L + (i / (points.length - 1)) * (W - L - R);
  const y = (k: number) => T + (1 - (k - lo) / (hi - lo)) * (H - T - B);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(" ");
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return (
    <svg className="hist" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Riwayat berat ${ks.join(", ")} kg`}>
      {[lo + 1, hi - 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#DDD5C4" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#57584F" fontFamily="var(--mono)">
            {Math.round(v)}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#C2412D" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.kg)} r="4" fill="#FBF8F1" stroke="#C2412D" strokeWidth="2" />
      ))}
      <text x={x(0)} y={H - 6} fontSize="11.5" fill="#8A897D">
        {fmt(points[0].date)}
      </text>
      <text x={x(points.length - 1)} y={H - 6} fontSize="11.5" fill="#8A897D" textAnchor="end">
        {fmt(points[points.length - 1].date)}
      </text>
    </svg>
  );
}

export default function Progress({
  plan,
  profileId,
  onWeigh,
}: {
  plan: Plan;
  profileId: string;
  onWeigh: (patch: Partial<PlanInput>) => Promise<string | null>;
}) {
  const [history, setHistory] = useState<{ kg: number; date: string }[]>([]);
  const loadHistory = () =>
    call<{ weights: { kg: number; created_at: string }[] }>(`/api/profiles/${profileId}/weights`)
      .then((d) => setHistory(d.weights.map((w) => ({ kg: Number(w.kg), date: w.created_at }))))
      .catch(() => {});
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);
  const [kg, setKg] = useState(plan.input.weightKg);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const first = history[0]?.kg;

  const save = async () => {
    setBusy(true);
    const e = await onWeigh({ weightKg: kg });
    setBusy(false);
    setMsg(e ? { ok: false, text: e } : { ok: true, text: "Tercatat. Jatah makan sudah disesuaikan dengan berat baru." });
    if (!e) loadHistory();
  };

  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>Progres</h2>
          </div>
          <div className="progress-top">
            <div className="card weigh">
              <span className="label">Timbang hari ini</span>
              <div className="weigh-row">
                <Stepper id="weigh" value={kg} min={30} max={250} step={0.1} unit="kg" onChange={setKg} />
                <button type="button" className="btn primary" onClick={save} disabled={busy}>
                  {busy ? "Menyimpan…" : "Catat berat"}
                </button>
              </div>
              {msg && <div className={`status ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
              {first != null && history.length > 1 && (
                <p className="weigh-delta">
                  Sejak awal:{" "}
                  <b className="num">
                    {plan.input.weightKg - first > 0 ? "+" : ""}
                    {c1(plan.input.weightKg - first)} kg
                  </b>{" "}
                  dari {history.length} kali timbang
                </p>
              )}
              <History points={history} />
            </div>
            <BodyPanel plan={plan} />
          </div>
        </div>
      </section>
      <Journey plan={plan} />
    </>
  );
}
