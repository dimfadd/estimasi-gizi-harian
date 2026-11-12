"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  customItem,
  LOG_BY_ID,
  LOG_ITEMS,
  MEAL_SLOTS,
  SUGAR_LIMIT_G,
  SWEET_LEVELS,
  localDate,
  shiftDate,
  slotForHour,
  sumNutrients,
  type LogItem,
  type MealSlot,
  type Nutrients,
} from "@/lib/log";
import { fmtAmount, plateFor, type Plan } from "@/lib/nutrition";
import { FoodIcon } from "./art";
import { activityName, fmtPace } from "@/lib/activity";
import FoodPicker, { type NewRow, type Recent } from "./FoodPicker";
import PhotoLog, { compressPhoto } from "./PhotoLog";
import { ProBadge } from "./Pro";
import { dayLabel, Meter, n0, Week } from "./TrackerParts";
import { call } from "./useAccount";

interface LogRow extends Nutrients {
  id: number | string;
  date: string;
  meal: MealSlot;
  food_id: string;
  amount: number;
  fried: boolean;
  sweet: number | null;
  sugar: number;
}

export interface ActivityRow {
  id: number | string;
  date: string;
  kind: "gym" | "cardio";
  activity_id: string;
  sets: { kg: number; reps: number }[] | null;
  minutes: number;
  km: number | null;
  intensity: string | null;
  kcal: number;
  rest_kcal: number;
}

/** Tambahan jatah makan dari olahraga yang melebihi rata-rata yang sudah ada di target. */
export function exerciseBonus(acts: ActivityRow[], allowance: number) {
  const net = acts.reduce((s, a) => s + Number(a.kcal) - Number(a.rest_kcal), 0);
  return { burned: acts.reduce((s, a) => s + Number(a.kcal), 0), net, bonus: Math.max(0, Math.round(net - allowance)) };
}

interface CustomRow {
  id: string;
  name: string;
  unit: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
}

function PhotoSample({
  profileId,
  date,
  meal,
  consented,
  onConsent,
}: {
  profileId: string;
  date: string;
  meal: MealSlot;
  consented: boolean;
  onConsent: () => Promise<void>;
}) {
  const [ask, setAsk] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | string>("idle");
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setState("busy");
    try {
      const fd = new FormData();
      fd.set("photo", new File([await compressPhoto(file)], "piring.jpg", { type: "image/jpeg" }));
      fd.set("profile", profileId);
      fd.set("date", date);
      fd.set("meal", meal);
      const res = await fetch("/api/samples", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah");
      setState("done");
    } catch (e) {
      setState(e instanceof Error ? e.message : "Gagal mengunggah");
    }
  };

  if (state === "done") return <p className="fine sample-done">Foto terkirim. Terima kasih sudah membantu menguji fitur foto.</p>;

  return (
    <div className="sample">
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {ask && !consented ? (
        <div className="sample-consent">
          <p>
            Foto piring ini beserta catatan isinya disimpan untuk menguji ketepatan fitur pencatat dari foto. Hanya tim Sekepal yang melihatnya,
            dan kamu bisa mencabut persetujuan serta menghapusnya dengan menghapus akun.
          </p>
          <div className="row">
            <button
              type="button"
              className="btn small"
              onClick={async () => {
                await onConsent();
                setAsk(false);
                input.current?.click();
              }}
            >
              Setuju & pilih foto
            </button>
            <button type="button" className="btn ghost small" onClick={() => setAsk(false)}>
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="linkish"
          disabled={state === "busy"}
          onClick={() => (consented ? input.current?.click() : setAsk(true))}
        >
          {state === "busy" ? "Mengunggah…" : "Bantu uji fitur foto: kirim foto piring ini"}
        </button>
      )}
      {state !== "idle" && state !== "busy" && <div className="status err">{state}</div>}
    </div>
  );
}

export default function Tracker({
  plan,
  profileId,
  samplesEnabled,
  photoConsent,
  onPhotoConsent,
  onPlan,
  pro,
  photoAi,
  onUpsell,
  onWorkout,
}: {
  plan: Plan;
  profileId: string;
  samplesEnabled: boolean;
  photoConsent: boolean;
  onPhotoConsent: () => Promise<void>;
  onPlan?: () => void;
  pro: boolean;
  photoAi: boolean;
  onUpsell: (feature: string) => void;
  onWorkout: () => void;
}) {
  const [date, setDate] = useState(() => localDate());
  const [slot, setSlot] = useState<MealSlot>(() => slotForHour(new Date().getHours()));
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customs, setCustoms] = useState<CustomRow[]>([]);
  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const from = shiftDate(date, -6);

  const loadLogs = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ profile: profileId, from, to: date });
      setLogs((await call<{ logs: LogRow[] }>(`/api/logs?${qs}`)).logs);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat");
    }
  }, [profileId, from, date]);

  const loadRecent = useCallback(async () => {
    try {
      setRecent((await call<{ recent: Recent[] }>(`/api/recent?profile=${profileId}`)).recent);
    } catch {}
  }, [profileId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  useEffect(() => {
    if (!pro) return;
    const qs = new URLSearchParams({ profile: profileId, from, to: date });
    call<{ activities: ActivityRow[] }>(`/api/activities?${qs}`).then((d) => setActs(d.activities), () => {});
  }, [pro, profileId, from, date]);
  useEffect(() => {
    loadRecent();
  }, [loadRecent]);
  useEffect(() => {
    call<{ favorites: string[] }>("/api/favorites").then((d) => setFavorites(d.favorites), () => {});
    call<{ foods: CustomRow[] }>("/api/foods").then((d) => setCustoms(d.foods), () => {});
  }, []);

  const items: LogItem[] = useMemo(() => [...LOG_ITEMS, ...customs.map(customItem)], [customs]);
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const addRows = async (rows: NewRow[], meal: MealSlot = slot, via = "manual", photoDraft?: string) => {
    if (rows.length === 0) return false;
    setBusy(true);
    setErr("");
    try {
      const { logs: added } = await call<{ logs: LogRow[] }>("/api/logs", {
        method: "POST",
        json: { profile: profileId, date, meal, via, items: rows, photoDraft },
      });
      setLogs((xs) => [...xs, ...added]);
      if (rows.some((r) => r.foodId !== "air")) loadRecent();
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: LogRow) => {
    setLogs((xs) => xs.filter((l) => l.id !== row.id));
    try {
      await call(`/api/logs?id=${row.id}`, { method: "DELETE" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menghapus");
      loadLogs();
    }
  };

  const copyYesterday = async () => {
    setBusy(true);
    setErr("");
    try {
      const { logs: added } = await call<{ logs: LogRow[] }>("/api/logs/copy", {
        method: "POST",
        json: { profile: profileId, from: shiftDate(date, -1), to: date, meal: slot },
      });
      setLogs((xs) => [...xs, ...added]);
      setNote(added.length ? `${added.length} makanan disalin dari kemarin.` : `Kemarin tidak ada catatan ${slotLabel}.`);
      setTimeout(() => setNote(""), 4000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyalin");
    } finally {
      setBusy(false);
    }
  };

  const toggleFav = (id: string, on: boolean) => {
    setFavorites((xs) => (on ? [...xs, id] : xs.filter((x) => x !== id)));
    call("/api/favorites", { method: "POST", json: { foodId: id, on } }).catch(() => {});
  };

  const createCustom = async (f: Record<string, unknown>) => {
    const { food } = await call<{ food: CustomRow }>("/api/foods", { method: "POST", json: f });
    setCustoms((xs) => [...xs, food]);
    return customItem(food);
  };

  const onMiss = useCallback((q: string) => {
    call("/api/events", { method: "POST", json: { name: "search_miss", q } }).catch(() => {});
  }, []);

  const planMeal = plan.meals.find((m) => m.key === slot);
  const addPlanPlate = () => {
    if (!planMeal) return;
    const pl = plateFor(planMeal, planMeal.defaultProtein);
    const carb = pl.carbOptions.find((o) => o.foodId === planMeal.defaultCarb) ?? pl.carbOptions[0];
    addRows(
      [
        ...(carb ? [{ foodId: carb.foodId, amount: carb.amount, fried: false }] : []),
        ...(pl.protein?.parts ?? []).map((p) => ({ foodId: p.foodId, amount: p.amount, fried: false })),
        { foodId: "sayur", amount: planMeal.veg.amount, fried: false },
        ...(pl.oil.amount > 0 ? [{ foodId: "minyak", amount: pl.oil.amount, fried: false }] : []),
      ],
      slot,
      "plan",
    );
  };

  const today = logs.filter((l) => l.date === date);
  const todayActs = acts.filter((a) => a.date === date);
  const ex = exerciseBonus(todayActs, plan.exerciseAllowanceKcal);
  const target = plan.targetKcal + ex.bonus;
  const total = sumNutrients(today);
  const water = today.filter((l) => l.food_id === "air");
  const waterGlasses = water.reduce((s, l) => s + Number(l.amount), 0);
  const sugarG = today.reduce((s, l) => s + Number(l.sugar ?? 0), 0);
  const addWater = () => addRows([{ foodId: "air", amount: 1, fried: false }], slotForHour(new Date().getHours()), "water");
  const removeWater = () => {
    const last = water[water.length - 1];
    if (last) remove(last);
  };
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = shiftDate(date, i - 6);
        return { date: d, kcal: logs.filter((l) => l.date === d).reduce((s, l) => s + Number(l.kcal), 0) };
      }),
    [logs, date],
  );
  const budget = (s: MealSlot) => (s === "camilan" ? plan.snackKcal : (plan.meals.find((m) => m.key === s)?.kcal ?? 0));
  const isToday = date === localDate();
  const slotLabel = MEAL_SLOTS.find((m) => m.key === slot)!.label.toLowerCase();

  return (
    <section className="section" id="catat">
      <div className="wrap">
        <div className="sec-head today-head">
          <h2>{isToday ? "Hari ini" : dayLabel(date)}</h2>
          {onPlan && (
            <button type="button" className="linkish" onClick={onPlan}>
              Belum tahu mau makan apa? Lihat isi piring yang disarankan
            </button>
          )}
        </div>

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

            <Meter big label="Kalori" value={total.kcal} target={target} unit="kkal" color="var(--ink)" kind="limit" />
            {pro ? (
              <button type="button" className="act-sum" onClick={onWorkout}>
                <span>
                  <b>Olahraga</b>{" "}
                  {todayActs.length === 0
                    ? "belum ada hari ini"
                    : todayActs
                        .map((a) =>
                          a.kind === "cardio" && a.km
                            ? `${activityName(a.kind, a.activity_id)} ${Number(a.km).toLocaleString("id-ID")} km · ${fmtPace(Number(a.minutes) / Number(a.km))}/km`
                            : activityName(a.kind, a.activity_id),
                        )
                        .join(", ")}
                </span>
                <span className="num">
                  {ex.burned > 0 ? `${n0(ex.burned)} kkal` : "+ catat"}
                  {ex.bonus > 0 && <em> · jatah +{n0(ex.bonus)}</em>}
                </span>
              </button>
            ) : (
              <button type="button" className="act-sum locked-row" onClick={() => onUpsell("olahraga")}>
                <span>
                  <b>Olahraga</b> lari, gym, sepeda ikut menambah jatah makan
                </span>
                <ProBadge />
              </button>
            )}
            <Meter label="Protein" value={total.p} target={plan.proteinG} unit="g" color="var(--mac-p)" kind="goal" />
            <Meter label="Serat" value={total.fb} target={plan.fiberG} unit="g" color="var(--leaf)" kind="goal" />
            <div className="meter-pair">
              <Meter label="Gula tambahan" value={sugarG} target={SUGAR_LIMIT_G} unit="g" color="#8E5A3C" kind="limit" />
              <div className="water">
                <div className="meter-top">
                  <span className="meter-label">Air putih</span>
                  <span className="meter-val">
                    <b>{fmtAmount(waterGlasses)}</b> / {plan.waterGlasses} gelas
                  </span>
                </div>
                <div className="water-ctl">
                  <button type="button" aria-label="Kurangi 1 gelas air" onClick={removeWater} disabled={busy || water.length === 0}>
                    −
                  </button>
                  <div className="glasses" aria-hidden>
                    {Array.from({ length: plan.waterGlasses }, (_, i) => (
                      <i key={i} className={i < waterGlasses ? "on" : ""} />
                    ))}
                  </div>
                  <button type="button" aria-label="Tambah 1 gelas air" onClick={addWater} disabled={busy}>
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="meter-pair">
              <Meter label="Karbo" value={total.c} target={plan.carbG} unit="g" color="var(--mac-c)" kind="range" />
              <Meter label="Lemak" value={total.f} target={plan.fatG} unit="g" color="var(--mac-f)" kind="limit" />
            </div>
          </div>

          <div className="card week-card">
            <span className="label">7 hari terakhir · ketuk untuk membuka harinya</span>
            <Week days={days} target={plan.targetKcal} selected={date} onPick={setDate} />
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
              </div>
              <div className="quick">
                <button type="button" className="btn ghost small" onClick={copyYesterday} disabled={busy}>
                  Sama seperti kemarin
                </button>
                {planMeal && (
                  <button type="button" className="btn ghost small" onClick={addPlanPlate} disabled={busy}>
                    Makan sesuai rencana
                  </button>
                )}
                <PhotoLog
                  pro={pro}
                  enabled={photoAi}
                  profileId={profileId}
                  handScale={plan.handScale}
                  slotLabel={slotLabel}
                  onSave={(rows, draftId) => addRows(rows, slot, "photo", draftId)}
                  onUpsell={() => onUpsell("foto")}
                />
              </div>
              {note && <div className="status ok">{note}</div>}

              <FoodPicker
                key={profileId}
                items={items}
                recent={recent}
                favorites={favorites}
                handScale={plan.handScale}
                busy={busy}
                slotLabel={slotLabel}
                onAdd={(rows) => addRows(rows)}
                onToggleFav={toggleFav}
                onCreateCustom={createCustom}
                onMiss={onMiss}
              />
              {err && <div className="status err">{err}</div>}
            </div>

            <div className="day-list">
              {MEAL_SLOTS.map((m) => {
                const rows = today.filter((l) => l.meal === m.key && l.food_id !== "air");
                const kcal = rows.reduce((s, l) => s + Number(l.kcal), 0);
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
                          const it = byId[r.food_id] ?? LOG_BY_ID[r.food_id];
                          return (
                            <li key={r.id}>
                              <FoodIcon id={it?.icon ?? "piring_isi"} size={32} />
                              <span className="what">
                                <b className="num">
                                  {fmtAmount(Number(r.amount))} {it?.unit}
                                </b>{" "}
                                {it?.name ?? "Makanan yang sudah dihapus"}
                                {r.fried ? " (goreng)" : ""}
                                {it?.sweetable ? ` · ${SWEET_LEVELS[Number(r.sweet ?? 0)]?.short ?? ""}` : ""}
                              </span>
                              <span className="num nut">
                                {n0(Number(r.kcal))} kkal · P {Math.round(Number(r.p))} · S {Math.round(Number(r.fb))}
                              </span>
                              <button type="button" className="x" aria-label={`Hapus ${it?.name ?? ""}`} onClick={() => remove(r)}>
                                ×
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {samplesEnabled && rows.length > 0 && (
                      <PhotoSample
                        key={`${date}-${m.key}`}
                        profileId={profileId}
                        date={date}
                        meal={m.key}
                        consented={photoConsent}
                        onConsent={onPhotoConsent}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
