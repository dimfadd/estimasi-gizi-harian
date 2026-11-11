"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LOG_BY_ID,
  LOG_ITEMS,
  MEAL_SLOTS,
  localDate,
  nutrientsOf,
  shiftDate,
  slotForHour,
  sumNutrients,
  type LogGroup,
  type MealSlot,
  type Nutrients,
} from "@/lib/log";
import { fmtAmount, plateFor, type Plan } from "@/lib/nutrition";
import { CODE_RE, store, type DbMode } from "@/lib/storage";
import { FoodIcon, HandIcon, type HandKind } from "./art";
import { Stepper } from "./Form";

interface LogRow extends Nutrients {
  id: number | string;
  date: string;
  meal: MealSlot;
  food_id: string;
  amount: number;
  fried: boolean;
}

const GROUPS: { key: LogGroup; label: string }[] = [
  { key: "karbo", label: "Nasi & karbo" },
  { key: "lauk", label: "Lauk" },
  { key: "sayur", label: "Sayur, buah, minyak" },
  { key: "camilan", label: "Camilan & minuman" },
];

const HAND_UNITS = ["kepal", "telapak", "ibu jari", "genggam"];
const nf = new Intl.NumberFormat("id-ID");
const n0 = (x: number) => nf.format(Math.round(x));

const localKey = (member: string) => `sekepal.logs.${member}`;

function dayLabel(iso: string, style: "long" | "short" = "long") {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return style === "long"
    ? dt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
    : dt.toLocaleDateString("id-ID", { weekday: "short" }).replace(".", "");
}

function UnitIcon({ foodId, size = 40 }: { foodId: string; size?: number }) {
  const it = LOG_BY_ID[foodId];
  if (it && HAND_UNITS.includes(it.unit) && foodId !== "sayur") return <HandIcon kind={it.unit as HandKind} size={size} />;
  return <FoodIcon id={foodId} size={size} />;
}

/* ---------------------------------------------------------------- meter */

function Meter({
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

function Week({ days, target, selected, onPick }: { days: { date: string; kcal: number }[]; target: number; selected: string; onPick: (d: string) => void }) {
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
              <rect x={x} y={y(d.kcal)} width={bw * 0.6} height={H - B - y(d.kcal)} rx="3" fill={over ? "#C2412D" : sel ? "#22231E" : "#9C9A8C"} />
            ) : (
              <rect x={x} y={H - B - 2} width={bw * 0.6} height={2} fill="#C7BDA8" />
            )}
            <text x={x + bw * 0.3} y={H - 5} textAnchor="middle" fontSize="11" fill={sel ? "#22231E" : "#8A897D"} fontWeight={sel ? 700 : 400}>
              {dayLabel(d.date, "short")}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="#22231E" strokeWidth="1.2" strokeDasharray="4 3" />
      <text x={W - 2} y={y(target) - 4} textAnchor="end" fontSize="10.5" fill="#57584F" fontFamily="var(--mono)">
        target {n0(target)}
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------- main */

export default function Tracker({
  plan,
  code,
  setCode,
  mode,
}: {
  plan: Plan;
  code: string;
  setCode: (c: string) => void;
  mode: DbMode;
}) {
  const { input } = plan;
  const member = input.name.trim().toLowerCase();
  const [date, setDate] = useState(() => localDate());
  const [slot, setSlot] = useState<MealSlot>(() => slotForHour(new Date().getHours()));
  const [group, setGroup] = useState<LogGroup>("karbo");
  const [foodId, setFoodId] = useState("nasi_putih");
  const [amount, setAmount] = useState(1);
  const [fried, setFried] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const from = shiftDate(date, -6);
  const ready = member !== "" && (mode === "local" || (mode === "db" && CODE_RE.test(code)));

  const fetchLogs = useCallback(async () => {
    setErr("");
    if (!ready) {
      setLogs([]);
      return;
    }
    if (mode === "local") {
      setLogs(store.json<LogRow[]>(localKey(member), []).filter((l) => l.date >= from && l.date <= date));
      return;
    }
    try {
      const qs = new URLSearchParams({ family: code, member, from, to: date });
      const res = await fetch(`/api/logs?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat");
      setLogs(data.logs);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat");
    }
  }, [ready, mode, member, code, from, date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const item = LOG_BY_ID[foodId];
  const preview = nutrientsOf(foodId, amount, plan.handScale, fried);

  const addRows = async (rows: { foodId: string; amount: number; fried: boolean }[]) => {
    if (!ready || rows.length === 0) return;
    setBusy(true);
    setErr("");
    try {
      if (mode === "local") {
        const all = store.json<LogRow[]>(localKey(member), []);
        const added: LogRow[] = rows.map((r, i) => ({
          id: `${Date.now()}-${i}`,
          date,
          meal: slot,
          food_id: r.foodId,
          amount: r.amount,
          fried: r.fried,
          ...nutrientsOf(r.foodId, r.amount, plan.handScale, r.fried)!,
        }));
        // simpan maksimal ±90 hari terakhir supaya storage tidak penuh
        const cutoff = shiftDate(localDate(), -90);
        store.set(localKey(member), JSON.stringify([...all.filter((l) => l.date >= cutoff), ...added]));
        setLogs((xs) => [...xs, ...added]);
      } else {
        const added: LogRow[] = [];
        for (const r of rows) {
          const res = await fetch("/api/logs", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              familyCode: code,
              member,
              date,
              meal: slot,
              foodId: r.foodId,
              amount: r.amount,
              fried: r.fried,
              heightCm: input.heightCm,
              sex: input.sex,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
          added.push(data.log);
        }
        setLogs((xs) => [...xs, ...added]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: LogRow) => {
    if (mode === "local") {
      store.set(localKey(member), JSON.stringify(store.json<LogRow[]>(localKey(member), []).filter((l) => l.id !== row.id)));
      setLogs((xs) => xs.filter((l) => l.id !== row.id));
      return;
    }
    const res = await fetch(`/api/logs?family=${encodeURIComponent(code)}&id=${row.id}`, { method: "DELETE" });
    if (res.ok) setLogs((xs) => xs.filter((l) => l.id !== row.id));
    else setErr("Gagal menghapus");
  };

  const planMeal = plan.meals.find((m) => m.key === slot);
  const addPlanPlate = () => {
    if (!planMeal) return;
    const pl = plateFor(planMeal, planMeal.defaultProtein);
    const carb = pl.carbOptions.find((o) => o.foodId === planMeal.defaultCarb) ?? pl.carbOptions[0];
    const rows = [
      ...(carb ? [{ foodId: carb.foodId, amount: carb.amount, fried: false }] : []),
      ...(pl.protein?.parts ?? []).map((p) => ({ foodId: p.foodId, amount: p.amount, fried: false })),
      { foodId: "sayur", amount: planMeal.veg.amount, fried: false },
      ...(pl.oil.amount > 0 ? [{ foodId: "minyak", amount: pl.oil.amount, fried: false }] : []),
    ];
    addRows(rows);
  };

  const today = logs.filter((l) => l.date === date);
  const total = sumNutrients(today);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = shiftDate(date, i - 6);
        return { date: d, kcal: logs.filter((l) => l.date === d).reduce((s, l) => s + l.kcal, 0) };
      }),
    [logs, date],
  );
  const budget = (s: MealSlot) => (s === "camilan" ? plan.snackKcal : (plan.meals.find((m) => m.key === s)?.kcal ?? 0));
  const isToday = date === localDate();

  const pickFood = (id: string) => {
    setFoodId(id);
    const it = LOG_BY_ID[id];
    setAmount(it.step === 1 ? 1 : 1);
    setFried(false);
  };

  return (
    <section className="section" id="catat">
      <div className="wrap">
        <div className="sec-head">
          <span className="idx">03</span>
          <h2>Catat makan</h2>
          <p>
            Catat yang benar-benar dimakan, pakai ukuran tangan yang sama. Garis hitam di tiap batang adalah target harian
            {input.name ? ` ${input.name}` : ""}.
          </p>
        </div>

        {!member ? (
          <div className="empty">Isi nama panggilan di formulir atas dulu. Catatan disimpan per nama.</div>
        ) : mode === "db" && !CODE_RE.test(code) ? (
          <div className="empty">
            Catatan disimpan per keluarga. Isi kode keluarga di bagian{" "}
            <a href="#keluarga" style={{ color: "inherit" }}>
              Keluarga
            </a>
            , atau{" "}
            <button
              type="button"
              className="linkish"
              onClick={() => {
                setCode(`keluarga-${Math.random().toString(36).slice(2, 7)}`);
              }}
            >
              buat kode acak sekarang
            </button>
            .
          </div>
        ) : (
          <div className="track">
            <div className="card track-sum">
              <div className="date-nav">
                <button type="button" aria-label="Hari sebelumnya" onClick={() => setDate(shiftDate(date, -1))}>
                  ‹
                </button>
                <div>
                  <b>{dayLabel(date)}</b>
                  {!isToday && (
                    <button type="button" className="linkish" onClick={() => setDate(localDate())}>
                      ke hari ini
                    </button>
                  )}
                </div>
                <button type="button" aria-label="Hari berikutnya" disabled={isToday} onClick={() => setDate(shiftDate(date, 1))}>
                  ›
                </button>
              </div>

              <Meter big label="Kalori" value={total.kcal} target={plan.targetKcal} unit="kkal" color="var(--ink)" kind="limit" />
              <Meter label="Protein" value={total.p} target={plan.proteinG} unit="g" color="var(--mac-p)" kind="goal" />
              <Meter label="Serat" value={total.fb} target={plan.fiberG} unit="g" color="var(--leaf)" kind="goal" />
              <Meter label="Karbohidrat" value={total.c} target={plan.carbG} unit="g" color="var(--mac-c)" kind="range" />
              <Meter label="Lemak" value={total.f} target={plan.fatG} unit="g" color="var(--mac-f)" kind="limit" />

              <div className="week-wrap">
                <span className="label">7 hari terakhir</span>
                <Week days={days} target={plan.targetKcal} selected={date} onPick={setDate} />
              </div>
              {mode === "local" && <p className="fine">Database belum disambung: catatan tersimpan di browser ini saja.</p>}
            </div>

            <div className="track-main">
              <div className="card add">
                <div className="add-head">
                  <div className="seg" role="group" aria-label="Waktu makan">
                    {MEAL_SLOTS.map((m) => (
                      <button key={m.key} type="button" aria-pressed={slot === m.key} onClick={() => setSlot(m.key)}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {planMeal && (
                    <button type="button" className="btn ghost small" onClick={addPlanPlate} disabled={busy}>
                      Makan sesuai rencana
                    </button>
                  )}
                </div>

                <div className="tabs small" role="tablist">
                  {GROUPS.map((g) => (
                    <button key={g.key} role="tab" aria-selected={group === g.key} onClick={() => setGroup(g.key)}>
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="food-grid">
                  {LOG_ITEMS.filter((i) => i.group === group).map((i) => (
                    <button key={i.id} type="button" className="food" aria-pressed={i.id === foodId} onClick={() => pickFood(i.id)}>
                      <FoodIcon id={i.id} size={40} />
                      <span>{i.name}</span>
                    </button>
                  ))}
                </div>

                {item && (
                  <div className="amount">
                    <UnitIcon foodId={foodId} size={52} />
                    <div className="amount-in">
                      <label className="label" htmlFor="amt">
                        {item.name}, berapa {item.unit}?
                      </label>
                      <div className="amount-row">
                        <Stepper id="amt" value={amount} min={item.step} max={20} step={item.step} unit={item.unit} onChange={setAmount} />
                        {item.fryable && (
                          <label className="check">
                            <input type="checkbox" checked={fried} onChange={(e) => setFried(e.target.checked)} />
                            digoreng
                          </label>
                        )}
                      </div>
                      {preview && (
                        <p className="preview num">
                          = {n0(preview.kcal)} kkal · protein {preview.p} g · serat {preview.fb} g
                          {fried && item.fryable ? " · sudah termasuk minyak yang terserap" : ""}
                        </p>
                      )}
                    </div>
                    <button type="button" className="btn primary" disabled={busy} onClick={() => addRows([{ foodId, amount, fried }])}>
                      {busy ? "Menyimpan…" : `Tambah ke ${MEAL_SLOTS.find((m) => m.key === slot)!.label.toLowerCase()}`}
                    </button>
                  </div>
                )}
                {err && <div className="status err">{err}</div>}
              </div>

              <div className="day-list">
                {MEAL_SLOTS.map((m) => {
                  const rows = today.filter((l) => l.meal === m.key);
                  const kcal = rows.reduce((s, l) => s + l.kcal, 0);
                  const b = budget(m.key);
                  if (rows.length === 0 && b === 0) return null;
                  return (
                    <div key={m.key} className="card day-meal">
                      <header>
                        <h3>{m.label}</h3>
                        <span className={`num ${b > 0 && kcal > b * 1.1 ? "over" : ""}`}>
                          {n0(kcal)} / {n0(b)} kkal
                        </span>
                      </header>
                      {rows.length === 0 ? (
                        <p className="fine">Belum ada catatan.</p>
                      ) : (
                        <ul>
                          {rows.map((r) => {
                            const it = LOG_BY_ID[r.food_id];
                            return (
                              <li key={r.id}>
                                <FoodIcon id={r.food_id} size={32} />
                                <span className="what">
                                  <b className="num">
                                    {fmtAmount(Number(r.amount))} {it?.unit}
                                  </b>{" "}
                                  {it?.name ?? r.food_id}
                                  {r.fried ? " (goreng)" : ""}
                                </span>
                                <span className="num nut">
                                  {n0(r.kcal)} kkal · P {Math.round(r.p)} · S {Math.round(Number(r.fb))}
                                </span>
                                <button type="button" className="x" aria-label={`Hapus ${it?.name}`} onClick={() => remove(r)}>
                                  ×
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
