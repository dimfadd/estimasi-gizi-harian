import { FOODS, SNACKS } from "./foods.ts";

export type MealSlot = "sarapan" | "siang" | "malam" | "camilan";
export type LogGroup = "karbo" | "lauk" | "sayur" | "camilan";

export const MEAL_SLOTS: { key: MealSlot; label: string }[] = [
  { key: "sarapan", label: "Sarapan" },
  { key: "siang", label: "Siang" },
  { key: "malam", label: "Malam" },
  { key: "camilan", label: "Camilan" },
];

export interface LogItem {
  id: string;
  name: string;
  group: LogGroup;
  /** satuan yang ditampilkan, mis. "kepal", "butir", "gelas" */
  unit: string;
  hand: boolean;
  step: 0.5 | 1;
  /** gizi per 1 satuan untuk tangan ukuran standar */
  kcal: number;
  p: number;
  c: number;
  f: number;
  fb: number;
  /** bisa dicentang "digoreng" */
  fryable: boolean;
}

const fromFood = (id: string, group: LogGroup, fryable: boolean): LogItem => {
  const f = FOODS[id];
  return { id, name: f.name, group, unit: f.unit, hand: f.hand, step: f.step, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fb: f.fb, fryable };
};

export const LOG_ITEMS: LogItem[] = [
  ...["nasi_putih", "nasi_merah", "jagung", "ubi", "kentang", "singkong", "oat", "roti"].map((id) =>
    fromFood(id, "karbo", id === "kentang" || id === "ubi" || id === "singkong"),
  ),
  ...["telur", "putih_telur", "dada_ayam", "paha_atas", "paha_bawah", "kembung", "lele", "nila", "ikan_potong", "daging", "tempe", "tahu", "edamame"].map(
    (id) => fromFood(id, "lauk", id !== "edamame" && id !== "putih_telur"),
  ),
  fromFood("sayur", "sayur", false),
  fromFood("pisang", "sayur", false),
  fromFood("minyak", "sayur", false),
  ...SNACKS.filter((s) => !["pisang", "ubi_rebus"].includes(s.id)).map(
    (s): LogItem => ({
      id: s.id,
      name: s.name,
      group: "camilan",
      unit: s.portion.replace(/^1\s+/, ""),
      hand: s.portion.includes("kepal") || s.portion.includes("genggam"),
      step: 1,
      kcal: s.kcal,
      p: s.p,
      c: s.c,
      f: s.f,
      fb: s.fb,
      fryable: false,
    }),
  ),
];

export const LOG_BY_ID: Record<string, LogItem> = Object.fromEntries(LOG_ITEMS.map((i) => [i.id, i]));

/** minyak yang terserap per satuan lauk/karbo yang digoreng, gram lemak */
export const FRY_FAT_G = 5;

export interface Nutrients {
  kcal: number;
  p: number;
  c: number;
  f: number;
  fb: number;
}

export function nutrientsOf(foodId: string, amount: number, handScale: number, fried: boolean): Nutrients | null {
  const it = LOG_BY_ID[foodId];
  if (!it || !(amount > 0)) return null;
  const k = amount * (it.hand ? handScale : 1);
  const extraF = fried && it.fryable ? FRY_FAT_G * k : 0;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    kcal: Math.round(it.kcal * k + extraF * 9),
    p: r1(it.p * k),
    c: r1(it.c * k),
    f: r1(it.f * k + extraF),
    fb: r1(it.fb * k),
  };
}

export function sumNutrients(xs: Nutrients[]): Nutrients {
  return xs.reduce((a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, fb: a.fb + b.fb }), {
    kcal: 0,
    p: 0,
    c: 0,
    f: 0,
    fb: 0,
  });
}

/** tanggal lokal YYYY-MM-DD */
export function localDate(d = new Date()) {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function shiftDate(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

export function slotForHour(h: number): MealSlot {
  if (h < 10) return "sarapan";
  if (h < 15) return "siang";
  if (h < 18) return "camilan";
  return "malam";
}
