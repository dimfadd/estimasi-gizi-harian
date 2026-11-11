import { FOOD_BY_ID, FOOD_DB, type DbFood, type LogGroup } from "./fooddb.ts";

export type { LogGroup };
export type MealSlot = "sarapan" | "siang" | "malam" | "camilan";
export type LogItem = DbFood;

export const MEAL_SLOTS: { key: MealSlot; label: string }[] = [
  { key: "sarapan", label: "Sarapan" },
  { key: "siang", label: "Siang" },
  { key: "malam", label: "Malam" },
  { key: "camilan", label: "Camilan" },
];

/** 0 tanpa gula · 1 tidak terlalu manis · 2 manis · 3 manis sekali */
export type Sweet = 0 | 1 | 2 | 3;

export const SWEET_LEVELS: { v: Sweet; label: string; short: string }[] = [
  { v: 0, label: "Tanpa gula", short: "tawar" },
  { v: 1, label: "Tidak terlalu manis", short: "agak manis" },
  { v: 2, label: "Manis", short: "manis" },
  { v: 3, label: "Manis sekali", short: "manis sekali" },
];

/** Gula tambahan per gelas 250 ml, perkiraan takaran warung/kedai. */
export const SUGAR_G: Record<Sweet, number> = { 0: 0, 1: 8, 2: 18, 3: 30 };

/** Batas gula tambahan Kemenkes: 50 g (4 sdm) per orang per hari */
export const SUGAR_LIMIT_G = 50;

export const DRINK_SIZES: { label: string; amount: number }[] = [
  { label: "Gelas kecil / cangkir", amount: 0.75 },
  { label: "1 kepal = gelas belimbing", amount: 1 },
  { label: "Botol 350 ml", amount: 1.5 },
  { label: "Cup plastik kekinian", amount: 2 },
];

export const LOG_ITEMS: LogItem[] = FOOD_DB;
export const LOG_BY_ID: Record<string, LogItem> = FOOD_BY_ID;

/** id lama yang sudah diganti, untuk data yang diklaim dari versi kode keluarga */
export const LEGACY_IDS: Record<string, { id: string; sweet?: Sweet }> = {
  es_teh: { id: "teh", sweet: 2 },
};

/** minyak yang terserap per satuan yang digoreng, gram lemak */
export const FRY_FAT_G = 5;

export interface Nutrients {
  kcal: number;
  p: number;
  c: number;
  f: number;
  fb: number;
}

/** Makanan buatan pengguna → item catatan. id selalu "u:<id>". */
export function customItem(row: { id: number | string; name: string; unit: string; kcal: number; protein: number; carb: number; fat: number; fiber: number }): LogItem {
  return {
    id: `u:${row.id}`,
    name: row.name,
    group: "buatanku",
    unit: row.unit,
    hand: false,
    step: 0.5,
    kcal: Number(row.kcal),
    p: Number(row.protein),
    c: Number(row.carb),
    f: Number(row.fat),
    fb: Number(row.fiber),
    sug: 0,
    fryable: false,
    sweetable: false,
    aka: "",
    icon: "piring_isi",
  };
}

export function sugarOf(item: LogItem | undefined, amount: number, sweet: Sweet | null | undefined) {
  if (!item) return 0;
  return ((item.sweetable && sweet ? SUGAR_G[sweet] : 0) + item.sug) * amount;
}

export function nutrientsOf(item: LogItem | undefined, amount: number, handScale: number, fried: boolean, sweet: Sweet = 0): (Nutrients & { sugar: number }) | null {
  if (!item || !(amount > 0)) return null;
  const k = amount * (item.hand ? handScale : 1);
  const extraF = fried && item.fryable ? FRY_FAT_G * k : 0;
  const added = item.sweetable && sweet ? SUGAR_G[sweet] * amount : 0;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    kcal: Math.round(item.kcal * k + extraF * 9 + added * 4),
    p: r1(item.p * k),
    c: r1(item.c * k + added),
    f: r1(item.f * k + extraF),
    fb: r1(item.fb * k),
    sugar: r1(sugarOf(item, amount, sweet)),
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
