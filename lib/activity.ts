// Aktivitas & perkiraan kalori. Rumus MET dari Compendium of Physical Activities.
import { EXERCISE_BY_ID } from "./exercises.ts";

export type Intensity = "santai" | "sedang" | "berat";

export interface Cardio {
  id: string;
  name: string;
  /** pakai jarak (km) & durasi; selain itu durasi + intensitas */
  distance: boolean;
  met: Record<Intensity, number>;
  icon: string;
}

export const CARDIO: Cardio[] = [
  { id: "lari", name: "Lari", distance: true, met: { santai: 7, sedang: 9.8, berat: 11.8 }, icon: "lari" },
  { id: "jalan", name: "Jalan kaki", distance: true, met: { santai: 2.8, sedang: 3.5, berat: 4.3 }, icon: "jalan" },
  { id: "sepeda", name: "Bersepeda", distance: true, met: { santai: 4, sedang: 6.8, berat: 10 }, icon: "sepeda" },
  { id: "hiking", name: "Hiking / naik gunung", distance: true, met: { santai: 5.3, sedang: 6, berat: 7.3 }, icon: "jalan" },
  { id: "renang", name: "Renang", distance: false, met: { santai: 5.8, sedang: 8, berat: 9.8 }, icon: "renang" },
  { id: "lompat_tali", name: "Lompat tali", distance: false, met: { santai: 8.8, sedang: 11.8, berat: 12.3 }, icon: "lari" },
  { id: "futsal", name: "Futsal / sepak bola", distance: false, met: { santai: 7, sedang: 8, berat: 10 }, icon: "bola" },
  { id: "badminton", name: "Badminton", distance: false, met: { santai: 4.5, sedang: 5.5, berat: 7 }, icon: "bola" },
  { id: "basket", name: "Basket", distance: false, met: { santai: 4.5, sedang: 6.5, berat: 8 }, icon: "bola" },
  { id: "bela_diri", name: "Bela diri (taekwondo, silat…)", distance: false, met: { santai: 5.3, sedang: 7.5, berat: 10.3 }, icon: "lari" },
  { id: "hiit", name: "HIIT / sirkuit", distance: false, met: { santai: 6, sedang: 8, berat: 10 }, icon: "lari" },
  { id: "aerobik", name: "Senam / aerobik / zumba", distance: false, met: { santai: 5, sedang: 6.5, berat: 7.3 }, icon: "lari" },
  { id: "yoga", name: "Yoga / pilates", distance: false, met: { santai: 2.5, sedang: 3, berat: 4 }, icon: "yoga" },
];

export const CARDIO_BY_ID: Record<string, Cardio> = Object.fromEntries(CARDIO.map((c) => [c.id, c]));

const KCAL_PER_MET_KG_H = 1.05;

/** MET bersepeda dari kecepatan rata-rata (km/jam) */
export function cyclingMet(kmh: number) {
  if (kmh < 16) return 4;
  if (kmh < 19) return 6.8;
  if (kmh < 22) return 8;
  if (kmh < 25) return 10;
  return 12;
}

/** MET lari dari kecepatan (km/jam) */
export function runningMet(kmh: number) {
  if (kmh < 7) return 6;
  if (kmh < 8.5) return 8.3;
  if (kmh < 10.5) return 9.8;
  if (kmh < 11.5) return 11;
  if (kmh < 13) return 11.8;
  return 12.8;
}

export interface CardioInput {
  activityId: string;
  minutes: number;
  km?: number;
  intensity?: Intensity;
}

/** Kalori kotor (termasuk kalori istirahat selama durasi itu). */
export function cardioKcal(c: CardioInput, bodyKg: number) {
  const a = CARDIO_BY_ID[c.activityId];
  if (!a || !(c.minutes > 0)) return 0;
  const h = c.minutes / 60;
  if (a.distance && c.km && c.km > 0) {
    const kmh = c.km / h;
    if (a.id === "lari") return Math.round(runningMet(kmh) * KCAL_PER_MET_KG_H * bodyKg * h);
    if (a.id === "sepeda") return Math.round(cyclingMet(kmh) * KCAL_PER_MET_KG_H * bodyKg * h);
    if (a.id === "jalan") return Math.round((kmh < 4 ? 2.8 : kmh < 5.5 ? 3.5 : 4.3) * KCAL_PER_MET_KG_H * bodyKg * h);
  }
  return Math.round(a.met[c.intensity ?? "sedang"] * KCAL_PER_MET_KG_H * bodyKg * h);
}

export interface SetEntry {
  kg: number;
  reps: number;
}

/** Latihan beban: ±2,5 menit per set (termasuk istirahat), MET 5. */
export function strengthMinutes(sets: SetEntry[]) {
  return Math.round(sets.length * 2.5);
}

export function strengthKcal(sets: SetEntry[], bodyKg: number) {
  return Math.round(5 * KCAL_PER_MET_KG_H * bodyKg * (strengthMinutes(sets) / 60));
}

export function volumeKg(sets: SetEntry[]) {
  return sets.reduce((s, x) => s + (x.kg > 0 ? x.kg * x.reps : 0), 0);
}

/** Kalori istirahat (1 MET) selama durasi aktivitas: tidak boleh dihitung dua kali dengan BMR. */
export function restKcal(minutes: number, bodyKg: number) {
  return KCAL_PER_MET_KG_H * bodyKg * (minutes / 60);
}

/** pace (menit/km) → teks "5:30" */
export function fmtPace(minPerKm: number) {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) return "–";
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${s === 60 ? m + 1 : m}:${String(s === 60 ? 0 : s).padStart(2, "0")}`;
}

export function activityName(kind: string, id: string) {
  return kind === "gym" ? (EXERCISE_BY_ID[id]?.name ?? id) : (CARDIO_BY_ID[id]?.name ?? id);
}
