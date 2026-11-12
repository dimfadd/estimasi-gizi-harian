"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  activityName,
  cardioKcal,
  CARDIO,
  CARDIO_BY_ID,
  fmtPace,
  strengthKcal,
  volumeKg,
  type Intensity,
  type SetEntry,
} from "@/lib/activity";
import { EXERCISE_BY_ID, exercisesFor, MUSCLE_LABEL, TARGETS, type Exercise } from "@/lib/exercises";
import { localDate, shiftDate } from "@/lib/log";
import { bodyFatEstimate, type Plan } from "@/lib/nutrition";
import { Locked, ProBadge } from "./Pro";
import type { ActivityRow } from "./Tracker";
import { dayLabel, n0 } from "./TrackerParts";
import { call } from "./useAccount";

const Mannequin3D = dynamic(() => import("./Mannequin3D"), { ssr: false, loading: () => <div className="ex-canvas" /> });

const EQUIP: Record<string, string> = { barbel: "Barbel", dumbel: "Dumbel", badan: "Berat badan", palang: "Palang" };
const FREE_TARGET = "dada";

function parsePace(t: string) {
  const m = t.trim().match(/^(\d{1,2})(?:[:.,](\d{1,2}))?$/);
  if (!m) return NaN;
  return Number(m[1]) + (m[2] ? Number(m[2].padEnd(2, "0")) / 60 : 0);
}

/* ------------------------------------------------------------------ viewer */

function ExerciseView({ ex, plan, onLog, canLog }: { ex: Exercise; plan: Plan; onLog: () => void; canLog: boolean }) {
  const [playing, setPlaying] = useState(true);
  const shape = { sex: plan.input.sex, heightCm: plan.input.heightCm, bmi: plan.bmi, bodyFatPct: bodyFatEstimate(plan.bmi, plan.input.age, plan.input.sex) };
  return (
    <div className="card ex-view">
      <div className="ex-canvas">
        <Mannequin3D shape={shape} exercise={ex} playing={playing} />
        <button type="button" className="ex-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Jeda animasi" : "Putar animasi"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="ex-legend">
          <span>
            <i className="lg-p" /> otot utama
          </span>
          {ex.secondary.length > 0 && (
            <span>
              <i className="lg-s" /> pendukung
            </span>
          )}
        </div>
      </div>
      <div className="ex-info">
        <h3>{ex.name}</h3>
        <div className="ex-tags">
          {ex.primary.map((m) => (
            <span key={m} className="tag-p">
              {MUSCLE_LABEL[m]}
            </span>
          ))}
          {ex.secondary.map((m) => (
            <span key={m} className="tag-s">
              {MUSCLE_LABEL[m]}
            </span>
          ))}
          <span className="tag-e">{EQUIP[ex.equipment]}</span>
        </div>
        <ol className="ex-steps">
          {ex.steps.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <p className="ex-dose">
          <b>Dosis:</b> {ex.dose}. Naikkan beban sedikit kalau semua set terasa ringan.
        </p>
        <button type="button" className={`btn ${canLog ? "primary" : "ghost"}`} onClick={onLog}>
          {canLog ? "Catat gerakan ini" : (
            <>
              Catat gerakan ini <ProBadge />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ logger */

function CardioForm({ bodyKg, onSave, busy }: { bodyKg: number; onSave: (b: Record<string, unknown>) => Promise<boolean>; busy: boolean }) {
  const [id, setId] = useState("lari");
  const [km, setKm] = useState("");
  const [mode, setMode] = useState<"durasi" | "pace" | "kecepatan">("durasi");
  const [minutes, setMinutes] = useState("");
  const [pace, setPace] = useState("");
  const [speed, setSpeed] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("sedang");
  const a = CARDIO_BY_ID[id];
  const dist = Number(km.replace(",", "."));
  const hasDist = a.distance && dist > 0;

  let mins = Number(minutes.replace(",", "."));
  if (hasDist && mode === "pace") mins = parsePace(pace) * dist;
  if (hasDist && mode === "kecepatan") mins = (dist / Number(speed.replace(",", "."))) * 60;
  const valid = Number.isFinite(mins) && mins > 0 && mins <= 600;
  const kmh = hasDist && valid ? dist / (mins / 60) : 0;
  const kcal = valid ? cardioKcal({ activityId: id, minutes: mins, km: hasDist ? dist : undefined, intensity }, bodyKg) : 0;

  return (
    <form
      className="act-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const ok = await onSave({ kind: "cardio", activityId: id, minutes: Math.round(mins * 10) / 10, km: hasDist ? dist : null, intensity });
        if (ok) {
          setKm("");
          setMinutes("");
          setPace("");
          setSpeed("");
        }
      }}
    >
      <div className="act-chips" role="group" aria-label="Aktivitas">
        {CARDIO.map((c) => (
          <button key={c.id} type="button" aria-pressed={c.id === id} onClick={() => setId(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="act-grid">
        {a.distance && (
          <label>
            <span className="label">Jarak (km)</span>
            <input className="text-input" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="mis. 5" />
          </label>
        )}
        {a.distance && hasDist && (
          <div>
            <span className="label">Isi salah satu</span>
            <div className="seg">
              {(["durasi", "pace", "kecepatan"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {m === "durasi" ? "Durasi" : m === "pace" ? "Pace" : "Kecepatan"}
                </button>
              ))}
            </div>
          </div>
        )}
        {(!hasDist || mode === "durasi") && (
          <label>
            <span className="label">Durasi (menit)</span>
            <input className="text-input" inputMode="decimal" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="mis. 30" />
          </label>
        )}
        {hasDist && mode === "pace" && (
          <label>
            <span className="label">Pace rata-rata (menit/km)</span>
            <input className="text-input" inputMode="decimal" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="mis. 6:30" />
          </label>
        )}
        {hasDist && mode === "kecepatan" && (
          <label>
            <span className="label">Kecepatan rata-rata (km/jam)</span>
            <input className="text-input" inputMode="decimal" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="mis. 18" />
          </label>
        )}
        {!hasDist && (
          <div>
            <span className="label">Intensitas</span>
            <div className="seg">
              {(["santai", "sedang", "berat"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={intensity === m} onClick={() => setIntensity(m)}>
                  {m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="act-result">
        {valid ? (
          <span className="num">
            {hasDist && (
              <>
                {Math.round(mins)} menit · pace {fmtPace(mins / dist)}/km · {kmh.toFixed(1).replace(".", ",")} km/jam ·{" "}
              </>
            )}
            <b>±{n0(kcal)} kkal</b>
          </span>
        ) : (
          <span className="fine">{a.distance ? "Isi jarak dan durasi/pace/kecepatan." : "Isi durasi."}</span>
        )}
        <button type="submit" className="btn primary" disabled={!valid || busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

function GymForm({
  ex,
  bodyKg,
  onPick,
  onSave,
  busy,
}: {
  ex: Exercise;
  bodyKg: number;
  onPick: (id: string) => void;
  onSave: (b: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
}) {
  const [sets, setSets] = useState<{ kg: string; reps: string }[]>([{ kg: "", reps: "" }]);
  const parsed: SetEntry[] = sets.map((s) => ({ kg: Number(s.kg.replace(",", ".")) || 0, reps: Number(s.reps) || 0 })).filter((s) => s.reps > 0);
  const upd = (i: number, k: "kg" | "reps", v: string) => setSets((xs) => xs.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  return (
    <form
      className="act-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (parsed.length === 0) return;
        if (await onSave({ kind: "gym", activityId: ex.id, sets: parsed })) setSets([{ kg: "", reps: "" }]);
      }}
    >
      <label>
        <span className="label">Gerakan</span>
        <select className="text-input" value={ex.id} onChange={(e) => onPick(e.target.value)}>
          {Object.values(EXERCISE_BY_ID).map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <div className="sets">
        <div className="sets-head">
          <span>Set</span>
          <span>{ex.weighted ? "Beban (kg)" : "Tambahan beban (kg)"}</span>
          <span>{ex.unit === "detik" ? "Detik" : "Repetisi"}</span>
          <span />
        </div>
        {sets.map((s, i) => (
          <div key={i} className="set-row">
            <span className="num">{i + 1}</span>
            <input className="text-input" inputMode="decimal" value={s.kg} onChange={(e) => upd(i, "kg", e.target.value)} placeholder={ex.weighted ? "20" : "0"} aria-label={`Beban set ${i + 1}`} />
            <input className="text-input" inputMode="numeric" value={s.reps} onChange={(e) => upd(i, "reps", e.target.value)} placeholder={ex.unit === "detik" ? "45" : "10"} aria-label={`Repetisi set ${i + 1}`} />
            <button type="button" className="x" aria-label={`Hapus set ${i + 1}`} onClick={() => setSets((xs) => (xs.length > 1 ? xs.filter((_, j) => j !== i) : xs))}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="linkish" onClick={() => setSets((xs) => [...xs, { ...xs[xs.length - 1] }])}>
          + Tambah set (salin set terakhir)
        </button>
      </div>
      <div className="act-result">
        {parsed.length > 0 ? (
          <span className="num">
            {parsed.length} set{volumeKg(parsed) > 0 && ` · volume ${n0(volumeKg(parsed))} kg`} · <b>±{n0(strengthKcal(parsed, bodyKg))} kkal</b>
          </span>
        ) : (
          <span className="fine">Isi beban dan repetisi tiap set.</span>
        )}
        <button type="submit" className="btn primary" disabled={parsed.length === 0 || busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ main */

export default function Workout({ plan, profileId, pro, onUpsell }: { plan: Plan; profileId: string; pro: boolean; onUpsell: (f: string) => void }) {
  const [target, setTarget] = useState(FREE_TARGET);
  const list = useMemo(() => exercisesFor(target), [target]);
  const [exId, setExId] = useState(list[0]?.id ?? "bench_press");
  const ex = EXERCISE_BY_ID[exId] ?? list[0];
  const [mode, setMode] = useState<"cardio" | "gym">("cardio");
  const [date, setDate] = useState(() => localDate());
  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const logger = useRef<HTMLDivElement>(null);
  const isToday = date === localDate();

  const load = useCallback(async () => {
    if (!pro) return;
    try {
      const qs = new URLSearchParams({ profile: profileId, from: shiftDate(date, -6), to: date });
      setActs((await call<{ activities: ActivityRow[] }>(`/api/activities?${qs}`)).activities);
    } catch {}
  }, [pro, profileId, date]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (b: Record<string, unknown>) => {
    setBusy(true);
    setErr("");
    try {
      const { activity } = await call<{ activity: ActivityRow }>("/api/activities", { method: "POST", json: { profile: profileId, date, ...b } });
      setActs((xs) => [...xs, activity]);
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const remove = async (a: ActivityRow) => {
    setActs((xs) => xs.filter((x) => x.id !== a.id));
    await call(`/api/activities?id=${a.id}`, { method: "DELETE" }).catch(() => load());
  };

  const today = acts.filter((a) => a.date === date);
  const week = acts.reduce((s, a) => s + Number(a.kcal), 0);
  const locked = !pro && target !== FREE_TARGET;

  const logThis = () => {
    if (!pro) return onUpsell("gym");
    setMode("gym");
    setTimeout(() => logger.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  const loggerCard = (
    <div className="card act-card" ref={logger}>
      <div className="act-head">
        <div className="date-nav slim">
          <button type="button" aria-label="Hari sebelumnya" onClick={() => setDate(shiftDate(date, -1))}>
            ‹
          </button>
          <b>{isToday ? "Hari ini" : dayLabel(date)}</b>
          <button type="button" aria-label="Hari berikutnya" disabled={isToday} onClick={() => setDate(shiftDate(date, 1))}>
            ›
          </button>
        </div>
        <div className="seg">
          <button type="button" aria-pressed={mode === "cardio"} onClick={() => setMode("cardio")}>
            Kardio & olahraga
          </button>
          <button type="button" aria-pressed={mode === "gym"} onClick={() => setMode("gym")}>
            Latihan beban
          </button>
        </div>
      </div>
      {mode === "cardio" ? (
        <CardioForm bodyKg={plan.input.weightKg} onSave={save} busy={busy} />
      ) : (
        <GymForm ex={ex} bodyKg={plan.input.weightKg} onPick={setExId} onSave={save} busy={busy} />
      )}
      {err && <div className="status err">{err}</div>}
      {today.length > 0 && (
        <ul className="act-list">
          {today.map((a) => (
            <li key={a.id}>
              <span>
                <b>{activityName(a.kind, a.activity_id)}</b>{" "}
                <span className="fine">
                  {a.kind === "gym"
                    ? (a.sets ?? []).map((s) => (s.kg ? `${s.kg}×${s.reps}` : `${s.reps}`)).join(" · ")
                    : a.km
                      ? `${Number(a.km).toLocaleString("id-ID")} km · ${Math.round(Number(a.minutes))} mnt · ${fmtPace(Number(a.minutes) / Number(a.km))}/km`
                      : `${Math.round(Number(a.minutes))} mnt · ${a.intensity}`}
                </span>
              </span>
              <span className="num">{n0(Number(a.kcal))} kkal</span>
              <button type="button" className="x" aria-label="Hapus" onClick={() => remove(a)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="fine">
        7 hari terakhir: <b className="num">{n0(week)}</b> kkal dari olahraga. Kalori latihan adalah perkiraan; jam pintar pun bisa meleset 20–30%.
      </p>
    </div>
  );

  return (
    <section className="section" id="latihan">
      <div className="wrap">
        <div className="sec-head">
          <h2>Latihan {!pro && <ProBadge />}</h2>
          <p>Catat olahraga supaya jatah makan hari itu ikut menyesuaikan, dan lihat gerakan untuk otot yang ingin kamu bentuk.</p>
        </div>

        {pro ? (
          loggerCard
        ) : (
          <Locked title="Catat lari, sepeda, futsal, dan set latihan beban" onUpsell={() => onUpsell("olahraga")}>
            {loggerCard}
          </Locked>
        )}

        <h3 className="sub-h">Mau membentuk otot apa?</h3>
        <div className="tabs small target-tabs" role="tablist">
          {TARGETS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={target === t.key}
              onClick={() => {
                setTarget(t.key);
                setExId(exercisesFor(t.key)[0]?.id ?? exId);
              }}
            >
              {t.label}
              {!pro && t.key !== FREE_TARGET && <span className="mini-lock">PRO</span>}
            </button>
          ))}
        </div>
        <div className="ex-layout">
          <div className="ex-list">
            {list.map((x) => (
              <button key={x.id} type="button" className="ex-item" aria-pressed={x.id === ex.id} onClick={() => setExId(x.id)}>
                <b>{x.name}</b>
                <span>
                  {EQUIP[x.equipment]} · {x.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}
                </span>
              </button>
            ))}
          </div>
          {locked ? (
            <Locked title={`Gerakan untuk ${TARGETS.find((t) => t.key === target)?.label.toLowerCase()} ada di Sekepal Pro`} onUpsell={() => onUpsell("gym")}>
              <div className="card ex-view" style={{ minHeight: 420 }} />
            </Locked>
          ) : (
            ex && <ExerciseView ex={ex} plan={plan} onLog={logThis} canLog={pro} />
          )}
        </div>
      </div>
    </section>
  );
}
