"use client";

import type { LogItem } from "@/lib/log";
import { FoodIcon, HandIcon, type HandKind } from "./art";

const HAND_UNITS = ["kepal", "telapak", "ibu jari", "genggam"];
const nf = new Intl.NumberFormat("id-ID");
export const n0 = (x: number) => nf.format(Math.round(x));

export function dayLabel(iso: string, style: "long" | "short" = "long") {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return style === "long"
    ? dt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
    : dt.toLocaleDateString("id-ID", { weekday: "short" }).replace(".", "");
}

export function UnitIcon({ item, size = 40 }: { item: LogItem; size?: number }) {
  if (HAND_UNITS.includes(item.unit) && item.id !== "sayur") return <HandIcon kind={item.unit as HandKind} size={size} />;
  return <FoodIcon id={item.icon} size={size} />;
}

/* ---------------------------------------------------------------- meter */

export function Meter({
  label,
  value,
  target,
  unit,
  color,
  kind,
  big,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  /** limit = jangan lewat (kalori, lemak); goal = usahakan tercapai (protein, serat) */
  kind: "limit" | "goal" | "range";
  big?: boolean;
}) {
  const scaleMax = Math.max(target * 1.25, value);
  const fill = Math.min(100, (value / scaleMax) * 100);
  const mark = (target / scaleMax) * 100;
  const diff = value - target;
  const over = diff > 0;
  let note: string;
  let tone = "";
  if (kind === "goal") {
    note = over || Math.abs(diff) < target * 0.03 ? "tercapai" : `kurang ${n0(-diff)} ${unit}`;
    tone = over ? "good" : "";
  } else if (kind === "limit") {
    note = over ? `lebih ${n0(diff)} ${unit}` : `sisa ${n0(-diff)} ${unit}`;
    tone = over && diff > target * 0.05 ? "bad" : "";
  } else {
    note = over ? `lebih ${n0(diff)} ${unit}` : `sisa ${n0(-diff)} ${unit}`;
  }
  return (
    <div className={`meter-row${big ? " big" : ""}`}>
      <div className="meter-top">
        <span className="meter-label">{label}</span>
        <span className="meter-val">
          <b>{n0(value)}</b> / {n0(target)} {unit}
        </span>
      </div>
      <div className="meter-track" role="img" aria-label={`${label} ${n0(value)} dari ${n0(target)} ${unit}`}>
        <div className="meter-fill" style={{ width: `${fill}%`, background: tone === "bad" ? "var(--chili)" : color }} />
        <div className="meter-mark" style={{ left: `${mark}%` }} />
      </div>
      <span className={`meter-note ${tone}`}>{note}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- week chart */

export function Week({ days, target, selected, onPick }: { days: { date: string; kcal: number }[]; target: number; selected: string; onPick: (d: string) => void }) {
  const W = 320,
    H = 120,
    B = 20,
    T = 8;
  const max = Math.max(target * 1.3, ...days.map((d) => d.kcal));
  const y = (k: number) => T + (1 - k / max) * (H - T - B);
  const bw = W / days.length;
  return (
    <svg className="week" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kalori 7 hari terakhir">
      {days.map((d, i) => {
        const x = i * bw + bw * 0.2;
        const over = d.kcal > target * 1.05;
        const sel = d.date === selected;
        return (
          <g key={d.date} onClick={() => onPick(d.date)} style={{ cursor: "pointer" }}>
            <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
            {d.kcal > 0 ? (
              <rect x={x} y={y(d.kcal)} width={bw * 0.6} height={H - B - y(d.kcal)} rx="3" fill={over ? "#F95A14" : sel ? "#121212" : "#B5B5B2"} />
            ) : (
              <rect x={x} y={H - B - 2} width={bw * 0.6} height={2} fill="#CFCFCC" />
            )}
            <text x={x + bw * 0.3} y={H - 5} textAnchor="middle" fontSize="11" fill={sel ? "#121212" : "#8A8A8A"} fontWeight={sel ? 700 : 400}>
              {dayLabel(d.date, "short")}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="#121212" strokeWidth="1.2" strokeDasharray="4 3" />
      <text x={W - 2} y={y(target) - 4} textAnchor="end" fontSize="10.5" fill="#4D4D4D" fontFamily="var(--mono)">
        target {n0(target)}
      </text>
    </svg>
  );
}

