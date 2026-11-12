import { CARB_IDS, FOODS, PROTEIN_COMBOS, PROTEIN_IDS, type Food } from "./foods.ts";

export type Sex = "pria" | "wanita";
export type Work = "duduk" | "campuran" | "fisik";
/** 0 = jarang, 1 = 1–2x, 2 = 3–4x, 3 = 5x+ per minggu */
export type Exercise = 0 | 1 | 2 | 3;
export type Goal = "turun" | "jaga" | "naik" | "otot";
export type Pace = "pelan" | "sedang" | "cepat";

export interface PlanInput {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  work: Work;
  exercise: Exercise;
  goal: Goal;
  /** berapa kg mau turun/naik (selalu positif) */
  changeKg: number;
  pace: Pace;
  meals: 2 | 3;
}

export interface Portion {
  foodId: string;
  amount: number;
  /** contoh: "1½ kepal" */
  label: string;
  grams: number;
  kcal: number;
  p: number;
}

export interface ProteinOption {
  key: string;
  parts: Portion[];
  p: number;
  kcal: number;
}

export interface Meal {
  key: "sarapan" | "siang" | "malam";
  label: string;
  share: number;
  /** anggaran kalori piring ini */
  kcal: number;
  proteinG: number;
  fatG: number;
  /** skala tangan pemilik rencana */
  scale: number;
  proteinOptions: ProteinOption[];
  defaultCarb: string;
  defaultProtein: string;
  veg: Portion;
}

export interface Plate {
  protein: ProteinOption | undefined;
  oil: Portion;
  carbOptions: Portion[];
}

export interface Plan {
  input: PlanInput;
  bmi: number;
  bmiLabel: string;
  bodyFatPct: number;
  bmr: number;
  activityFactor: number;
  tdee: number;
  /** rata-rata kalori olahraga per hari yang sudah termasuk di tdee */
  exerciseAllowanceKcal: number;
  targetKcal: number;
  /** negatif = defisit, positif = surplus */
  deltaKcal: number;
  weeklyChangeKg: number;
  weeksToGoal: number | null;
  targetWeightKg: number;
  mode: "defisit" | "jaga" | "surplus" | "rekomposisi";
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
  waterGlasses: number;
  handScale: number;
  snackKcal: number;
  meals: Meal[];
  daily: { proteinPalms: number; carbFists: number; vegFists: number; oilThumbs: number };
  notes: string[];
}

const KCAL_PER_KG = 7700;
const PACE_KG: Record<Pace, number> = { pelan: 0.25, sedang: 0.5, cepat: 0.75 };
const WORK_BASE: Record<Work, number> = { duduk: 1.2, campuran: 1.35, fisik: 1.5 };
const EXERCISE_ADD = [0, 0.075, 0.15, 0.225];

export const round = (x: number, step = 1) => Math.round(x / step) * step;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** 1.5 -> "1½", 0.5 -> "½", 2 -> "2" */
export function fmtAmount(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const half = n - whole >= 0.5 - 1e-9;
  if (whole === 0 && half) return "½";
  return `${whole}${half ? "½" : ""}`;
}

export function bmiOf(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number) {
  // Klasifikasi Kemenkes RI untuk orang Indonesia
  if (bmi < 17) return "Kurus berat";
  if (bmi < 18.5) return "Kurus";
  if (bmi <= 25) return "Normal";
  if (bmi <= 27) return "Gemuk";
  return "Obesitas";
}

/** Perkiraan persen lemak tubuh dari BMI (Deurenberg 1991). Kasar, ±4–5%. */
export function bodyFatEstimate(bmi: number, age: number, sex: Sex) {
  const s = sex === "pria" ? 1 : 0;
  return clamp(1.2 * bmi + 0.23 * age - 10.8 * s - 5.4, 4, 60);
}

/** Mifflin–St Jeor */
export function bmrOf(input: Pick<PlanInput, "sex" | "age" | "heightCm" | "weightKg">) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return base + (input.sex === "pria" ? 5 : -161);
}

export function activityFactor(work: Work, exercise: Exercise) {
  return Math.min(1.9, WORK_BASE[work] + EXERCISE_ADD[exercise]);
}

/** Tangan orang yang lebih tinggi lebih besar, jadi satu kepalnya berisi lebih banyak. */
export function handScaleOf(heightCm: number, sex: Sex) {
  return clamp((heightCm / 170) * (sex === "wanita" ? 0.9 : 1), 0.78, 1.15);
}

function portion(food: Food, gramsTarget: number | null, amountRaw: number, scale: number, allowZero = false): Portion {
  const unitGrams = food.hand ? food.grams * scale : food.grams;
  let amount = gramsTarget != null ? gramsTarget / unitGrams : amountRaw;
  amount = round(amount, food.step);
  if (!allowZero) amount = Math.max(food.step, amount);
  const k = (amount * unitGrams) / food.grams;
  return {
    foodId: food.id,
    amount,
    label: `${fmtAmount(amount)} ${food.unit}`,
    grams: Math.round(amount * unitGrams),
    kcal: Math.round(food.kcal * k),
    p: Math.round(food.p * k),
  };
}

function byNutrient(food: Food, key: "p" | "c" | "f", need: number, scale: number): Portion {
  const perUnit = food[key] * (food.hand ? scale : 1);
  return portion(food, null, perUnit > 0 ? need / perUnit : 0, scale);
}

function proteinOptions(lauk: number, scale: number): ProteinOption[] {
  const opts: ProteinOption[] = [];
  for (const id of PROTEIN_IDS) {
    const f = FOODS[id];
    const part = byNutrient(f, "p", lauk, scale);
    if (part.amount > f.max) continue;
    opts.push({ key: id, parts: [part], p: part.p, kcal: part.kcal });
  }
  for (const [a, b] of PROTEIN_COMBOS) {
    const pa = byNutrient(FOODS[a], "p", lauk / 2, scale);
    const pb = byNutrient(FOODS[b], "p", lauk / 2, scale);
    if (pa.amount > FOODS[a].max || pb.amount > FOODS[b].max) continue;
    opts.push({ key: `${a}+${b}`, parts: [pa, pb], p: pa.p + pb.p, kcal: pa.kcal + pb.kcal });
  }
  return opts;
}

const MEAL_SPLIT: Record<2 | 3, { key: Meal["key"]; label: string; share: number; carb: string; protein: string[] }[]> = {
  3: [
    { key: "sarapan", label: "Sarapan", share: 0.25, carb: "nasi_putih", protein: ["telur+tempe", "telur+tahu", "telur", "tempe"] },
    { key: "siang", label: "Makan siang", share: 0.35, carb: "nasi_putih", protein: ["dada_ayam", "paha_atas+tempe", "paha_atas"] },
    { key: "malam", label: "Makan malam", share: 0.3, carb: "nasi_putih", protein: ["kembung", "nila", "ikan_potong", "kembung+tahu"] },
  ],
  2: [
    { key: "siang", label: "Makan pertama (siang)", share: 0.45, carb: "nasi_putih", protein: ["dada_ayam", "paha_atas+tempe", "paha_atas"] },
    { key: "malam", label: "Makan malam", share: 0.42, carb: "nasi_putih", protein: ["kembung", "nila", "ikan_potong", "kembung+tahu"] },
  ],
};

const partFat = (part: Portion) => (FOODS[part.foodId].f * part.grams) / FOODS[part.foodId].grams;

/**
 * Isi piring untuk lauk tertentu. Lauk & sayur ditetapkan dulu, minyak mengisi
 * sisa jatah lemak, lalu karbo mengisi sisa kalori. Jadi kalau lauknya lebih
 * berlemak (daging, telur), nasinya otomatis berkurang.
 */
export function plateFor(meal: Meal, proteinKey: string): Plate {
  const protein = meal.proteinOptions.find((o) => o.key === proteinKey) ?? meal.proteinOptions[0];
  const laukFat = protein ? protein.parts.reduce((s, part) => s + partFat(part), 0) : 0;
  const oilFat = Math.max(0, meal.fatG - laukFat - 1);
  const oil = portion(FOODS.minyak, null, oilFat / (FOODS.minyak.f * meal.scale), meal.scale, true);
  const carbKcal = Math.max(60, meal.kcal - (protein?.kcal ?? 0) - meal.veg.kcal - oil.kcal);
  const carbOptions = CARB_IDS.map((id) => {
    const f = FOODS[id];
    return portion(f, null, carbKcal / (f.kcal * (f.hand ? meal.scale : 1)), meal.scale);
  }).filter((o) => o.amount <= FOODS[o.foodId].max);
  return { protein, oil, carbOptions };
}

/** Total gizi satu piring sesuai pilihan karbo & lauk. */
export function plateTotals(meal: Meal, carbId: string, proteinKey: string) {
  const pl = plateFor(meal, proteinKey);
  const parts: Portion[] = [meal.veg, pl.oil, ...(pl.protein?.parts ?? [])];
  const carb = pl.carbOptions.find((o) => o.foodId === carbId) ?? pl.carbOptions[0];
  if (carb) parts.push(carb);
  let kcal = 0, p = 0, c = 0, f = 0, fb = 0;
  for (const part of parts) {
    const food = FOODS[part.foodId];
    const k = part.grams / food.grams;
    kcal += food.kcal * k; p += food.p * k; c += food.c * k; f += food.f * k; fb += food.fb * k;
  }
  return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f), fb: Math.round(fb) };
}

export function buildPlan(input: PlanInput): Plan {
  const notes: string[] = [];
  const { sex, age, heightCm, weightKg, goal } = input;
  const h2 = (heightCm / 100) ** 2;

  const bmi = bmiOf(weightKg, heightCm);
  const bodyFatPct = bodyFatEstimate(bmi, age, sex);
  const bmr = bmrOf(input);
  const af = activityFactor(input.work, input.exercise);
  const tdee = bmr * af;
  const floor = sex === "pria" ? 1500 : 1200;
  const fatHigh = sex === "pria" ? bodyFatPct >= 25 : bodyFatPct >= 32;

  let mode: Plan["mode"] = "jaga";
  let delta = 0;
  const pace = PACE_KG[input.pace];

  if (goal === "turun") {
    mode = "defisit";
    delta = -Math.min((pace * KCAL_PER_KG) / 7, tdee * 0.25);
    if (input.pace === "cepat" && bmi < 27) {
      notes.push("Kecepatan 'cepat' lebih cocok untuk yang BMI-nya di atas 27. Dengan BMI kamu, otot ikut hilang lebih banyak.");
    }
  } else if (goal === "naik") {
    mode = "surplus";
    delta = Math.min((pace * KCAL_PER_KG) / 7, 700);
    if (input.pace === "cepat") notes.push("Naik 0,75 kg/minggu sebagian besar akan jadi lemak, bukan otot.");
  } else if (goal === "otot") {
    if (fatHigh) {
      mode = "rekomposisi";
      delta = -Math.min(tdee * 0.15, 400);
      notes.push(
        "Lemak tubuhmu masih cukup tinggi, jadi programnya rekomposisi: makan sedikit di bawah kebutuhan, protein tinggi, latihan beban progresif. Otot tetap bisa naik sambil lemak turun.",
      );
    } else {
      mode = "surplus";
      delta = input.pace === "pelan" ? 200 : input.pace === "sedang" ? 300 : 450;
    }
  }

  let targetKcal = tdee + delta;
  if (targetKcal < floor) {
    targetKcal = floor;
    notes.push(`Kalori ditahan di ${floor} kkal supaya tidak terlalu rendah. Akibatnya target tercapai lebih lama.`);
  }
  if (targetKcal < bmr && mode === "defisit") {
    notes.push("Target kalori di bawah BMR. Masih aman untuk jangka pendek, tapi pantau lemas, pusing, dan kualitas tidur.");
  }
  targetKcal = round(targetKcal, 10);
  delta = targetKcal - tdee;

  const weeklyChangeKg = (delta * 7) / KCAL_PER_KG;
  let targetWeightKg = weightKg;
  let weeksToGoal: number | null = null;
  if ((goal === "turun" || goal === "naik") && input.changeKg > 0) {
    targetWeightKg = goal === "turun" ? weightKg - input.changeKg : weightKg + input.changeKg;
    weeksToGoal = Math.abs(weeklyChangeKg) > 0.01 ? Math.ceil(input.changeKg / Math.abs(weeklyChangeKg)) : null;
  }
  if (goal === "otot" && mode === "rekomposisi") {
    targetWeightKg = weightKg;
  }

  const targetBmi = targetWeightKg / h2;
  if (goal === "turun" && bmi < 18.5) notes.push("BMI kamu sudah di bawah normal. Menurunkan berat tidak disarankan.");
  else if (goal === "turun" && targetBmi < 18.5)
    notes.push(`Berat target ${targetWeightKg.toFixed(0)} kg membuat BMI di bawah 18,5. Coba target yang lebih kecil.`);
  if (goal === "naik" && targetBmi > 27) notes.push("Berat target membuat BMI di atas 27. Pertimbangkan program otot daripada naik berat.");
  if (age < 18) notes.push("Rumus ini untuk dewasa. Remaja yang masih tumbuh butuh lebih banyak; konsultasikan ke ahli gizi.");
  if (age >= 65) notes.push("Usia 65+: protein dan latihan beban ringan penting untuk menjaga otot. Cek dulu ke dokter kalau ada penyakit ginjal.");

  // ---------- makro ----------
  // Untuk orang yang gemuk, protein dihitung dari berat badan "BMI 25", bukan berat sekarang.
  const refWeight = Math.min(weightKg, 25 * h2);
  const proteinPerKg =
    mode === "rekomposisi" ? 2.0 : goal === "turun" ? 1.8 : goal === "otot" ? 2.0 : goal === "naik" ? 1.6 : 1.4;
  const proteinG = Math.round(proteinPerKg * refWeight);
  const fatG = Math.round(Math.max((targetKcal * 0.27) / 9, 0.6 * refWeight));
  const carbG = Math.max(0, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));
  if (carbG < 100) notes.push("Karbohidrat di bawah 100 g/hari. Kalau terasa lemas saat latihan, kurangi defisitnya.");
  const fiberG = Math.round((targetKcal / 1000) * 14);
  const waterGlasses = Math.round((weightKg * 35 + (input.exercise >= 2 ? 500 : 0)) / 250);

  const scale = handScaleOf(heightCm, sex);
  const snackShare = input.meals === 3 ? 0.1 : 0.13;
  const snackKcal = round(targetKcal * snackShare, 10);
  const mainShare = 1 - snackShare;

  // sarapan orang Indonesia jarang banyak sayur, jadi sarapan cukup 1 kepal
  const vegPerMeal = sex === "pria" ? 2 : 1.5;
  const meals: Meal[] = MEAL_SPLIT[input.meals].map((m) => {
    const w = m.share / mainShare;
    const mealKcal = round(targetKcal * m.share, 10);
    const mealP = proteinG * w;
    const mealF = fatG * m.share;
    // sarapan orang Indonesia jarang banyak sayur, cukup 1 kepal
    const veg = portion(FOODS.sayur, null, m.key === "sarapan" ? 1 : vegPerMeal, scale);
    // perkiraan protein dari nasi (±9% dari gram karbo) dan sayur
    const stapleP = carbG * m.share * 0.09;
    const lauk = Math.max(8, mealP - stapleP - veg.p);
    const pOpts = proteinOptions(lauk, scale);
    const defaultProtein = m.protein.find((k) => pOpts.some((o) => o.key === k)) ?? pOpts[0]?.key ?? "";
    return {
      key: m.key,
      label: m.label,
      share: m.share,
      kcal: mealKcal,
      proteinG: Math.round(mealP),
      fatG: Math.round(mealF),
      scale,
      proteinOptions: pOpts,
      defaultCarb: m.carb,
      defaultProtein,
      veg,
    };
  });

  const plates = meals.map((m) => plateFor(m, m.defaultProtein));
  const daily = {
    proteinPalms: round(proteinG / (FOODS.dada_ayam.p * scale), 0.5),
    carbFists: plates.reduce((s, pl) => s + (pl.carbOptions.find((o) => o.foodId === "nasi_putih")?.amount ?? 0), 0),
    vegFists: meals.reduce((s, m) => s + m.veg.amount, 0),
    oilThumbs: plates.reduce((s, pl) => s + pl.oil.amount, 0),
  };

  return {
    input,
    bmi,
    bmiLabel: bmiCategory(bmi),
    bodyFatPct,
    bmr: Math.round(bmr),
    activityFactor: af,
    tdee: Math.round(tdee),
    exerciseAllowanceKcal: Math.round((af - WORK_BASE[input.work]) * bmr),
    targetKcal,
    deltaKcal: Math.round(delta),
    weeklyChangeKg,
    weeksToGoal,
    targetWeightKg,
    mode,
    proteinG,
    fatG,
    carbG,
    fiberG,
    waterGlasses,
    handScale: scale,
    snackKcal,
    meals,
    daily,
    notes,
  };
}

/** Validasi & normalisasi input dari form / API. */
export function sanitizeInput(raw: unknown): PlanInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, lo: number, hi: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
  };
  const oneOf = <T extends string | number>(v: unknown, list: readonly T[]) => (list.includes(v as T) ? (v as T) : null);

  const out = {
    name: typeof r.name === "string" ? r.name.trim().slice(0, 40) : "",
    sex: oneOf(r.sex, ["pria", "wanita"] as const),
    age: num(r.age, 13, 90),
    heightCm: num(r.heightCm, 120, 220),
    weightKg: num(r.weightKg, 30, 250),
    work: oneOf(r.work, ["duduk", "campuran", "fisik"] as const),
    exercise: oneOf(r.exercise, [0, 1, 2, 3] as const),
    goal: oneOf(r.goal, ["turun", "jaga", "naik", "otot"] as const),
    changeKg: num(r.changeKg, 0, 80),
    pace: oneOf(r.pace, ["pelan", "sedang", "cepat"] as const),
    meals: oneOf(r.meals, [2, 3] as const),
  };
  for (const v of Object.values(out)) if (v === null) return null;
  return out as PlanInput;
}
