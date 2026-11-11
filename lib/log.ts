import { FOODS, SNACKS } from "./foods.ts";

export type MealSlot = "sarapan" | "siang" | "malam" | "camilan";
export type LogGroup = "karbo" | "lauk" | "sayur" | "minum" | "camilan";

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
  /** minuman yang bisa diberi gula */
  sweetable?: boolean;
}

/** 0 tanpa gula · 1 tidak terlalu manis · 2 manis · 3 manis sekali */
export type Sweet = 0 | 1 | 2 | 3;

export const SWEET_LEVELS: { v: Sweet; label: string; short: string }[] = [
  { v: 0, label: "Tanpa gula", short: "tawar" },
  { v: 1, label: "Tidak terlalu manis", short: "agak manis" },
  { v: 2, label: "Manis", short: "manis" },
  { v: 3, label: "Manis sekali", short: "manis sekali" },
];

/**
 * Gula tambahan per gelas 250 ml. Perkiraan dari takaran warung/kedai:
 * es teh manis biasa ±2 sdm (18 g), kopi kekinian / teh botol ±30 g.
 */
export const SUGAR_G: Record<Sweet, number> = { 0: 0, 1: 8, 2: 18, 3: 30 };

/** Batas gula tambahan Kemenkes: 50 g (4 sdm) per orang per hari */
export const SUGAR_LIMIT_G = 50;

/** Ukuran cepat untuk minuman, dalam gelas 250 ml (≈ 1 kepal) */
export const DRINK_SIZES: { label: string; amount: number }[] = [
  { label: "Gelas kecil / cangkir", amount: 0.75 },
  { label: "1 kepal = gelas belimbing", amount: 1 },
  { label: "Botol 350 ml", amount: 1.5 },
  { label: "Cup plastik kekinian", amount: 2 },
];

const drink = (id: string, name: string, kcal: number, p: number, c: number, f: number, fb = 0, sweetable = true): LogItem => ({
  id, name, group: "minum", unit: "gelas", hand: false, step: 0.5, kcal, p, c, f, fb, fryable: false, sweetable,
});

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
  // minuman: gizi dasar per gelas 250 ml TANPA gula; gula ditambah sesuai tingkat manis
  drink("air", "Air putih", 0, 0, 0, 0, 0, false),
  drink("teh", "Teh (es/panas)", 2, 0, 0.5, 0),
  drink("kopi", "Kopi hitam", 5, 0.3, 0, 0),
  drink("kopi_susu", "Kopi susu", 70, 3.5, 5.5, 3.8),
  drink("susu_gelas", "Susu", 150, 8, 12, 8),
  drink("jus", "Jus buah", 100, 1, 24, 0.5, 1),
  drink("es_jeruk", "Es jeruk", 30, 0.5, 7, 0),
  drink("boba", "Milk tea / boba", 140, 2, 26, 3),
  drink("kemasan", "Minuman kemasan / soda", 0, 0, 0, 0),
  fromFood("sayur", "sayur", false),
  fromFood("pisang", "sayur", false),
  fromFood("minyak", "sayur", false),
  ...SNACKS.filter((s) => !["pisang", "ubi_rebus", "es_teh", "kopi_susu"].includes(s.id)).map(
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

export function sugarOf(foodId: string, amount: number, sweet: Sweet | null | undefined) {
  const it = LOG_BY_ID[foodId];
  return it?.sweetable && sweet ? SUGAR_G[sweet] * amount : 0;
}

export function nutrientsOf(foodId: string, amount: number, handScale: number, fried: boolean, sweet: Sweet = 0): Nutrients | null {
  const it = LOG_BY_ID[foodId];
  if (!it || !(amount > 0)) return null;
  const k = amount * (it.hand ? handScale : 1);
  const extraF = fried && it.fryable ? FRY_FAT_G * k : 0;
  const sugar = sugarOf(foodId, amount, sweet);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    kcal: Math.round(it.kcal * k + extraF * 9 + sugar * 4),
    p: r1(it.p * k),
    c: r1(it.c * k + sugar),
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
