// Pustaka gerakan latihan beban untuk animasi 3D & pencatatan.
// Sudut dalam derajat. Pose A ↔ B diputar bolak-balik.

export type Muscle =
  | "dada"
  | "bahu"
  | "bisep"
  | "trisep"
  | "lengan_bawah"
  | "punggung"
  | "punggung_bawah"
  | "perut"
  | "bokong"
  | "paha_depan"
  | "paha_belakang"
  | "betis";

export const MUSCLE_LABEL: Record<Muscle, string> = {
  dada: "Dada",
  bahu: "Bahu",
  bisep: "Bisep",
  trisep: "Trisep",
  lengan_bawah: "Lengan bawah",
  punggung: "Punggung atas",
  punggung_bawah: "Punggung bawah",
  perut: "Perut",
  bokong: "Bokong",
  paha_depan: "Paha depan",
  paha_belakang: "Paha belakang",
  betis: "Betis",
};

/** Kelompok yang dipilih pengguna ("mau besarin apa") → otot di dalamnya */
export const TARGETS: { key: string; label: string; muscles: Muscle[] }[] = [
  { key: "dada", label: "Dada", muscles: ["dada"] },
  { key: "punggung", label: "Punggung", muscles: ["punggung", "punggung_bawah"] },
  { key: "bahu", label: "Bahu", muscles: ["bahu"] },
  { key: "lengan", label: "Lengan", muscles: ["bisep", "trisep", "lengan_bawah"] },
  { key: "kaki", label: "Kaki", muscles: ["paha_depan", "paha_belakang", "betis"] },
  { key: "bokong", label: "Bokong", muscles: ["bokong"] },
  { key: "perut", label: "Perut", muscles: ["perut"] },
];

type Side = [number, number]; // [kiri, kanan]

export interface Pose {
  /** tinggi panggul dari lantai (m, untuk tinggi badan 172 cm) */
  y: number;
  /** maju-mundur panggul (m) */
  z?: number;
  /** kemiringan seluruh badan: 0 berdiri, -90 telentang, 90 telungkup */
  rx: number;
  /** badan membungkuk ke depan */
  spine: number;
  /** bahu: angkat ke depan, angkat ke samping, putar */
  sF: Side;
  sA: Side;
  sT?: Side;
  /** siku menekuk */
  el: Side;
  /** pinggul: angkat paha ke depan, buka ke samping */
  hF: Side;
  hA?: Side;
  /** lutut menekuk */
  kn: Side;
}

export type Equipment = "barbel" | "dumbel" | "badan" | "palang";
export type Prop = "barbel" | "dumbel" | "bangku" | "palang";

export interface Exercise {
  id: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: Equipment;
  props: Prop[];
  /** satuan per set: repetisi atau detik */
  unit: "rep" | "detik";
  /** pakai beban (kg) atau berat badan */
  weighted: boolean;
  /** sudut kamera: "samping" untuk gerakan berbaring/menunduk */
  view: "depan" | "samping" | "belakang";
  period: number;
  a: Pose;
  b: Pose;
  steps: string[];
  dose: string;
}

const s = (n: number): Side => [n, n];
const stand = (o: Partial<Pose> = {}): Pose => ({ y: 0.92, rx: 0, spine: 0, sF: s(0), sA: s(8), el: s(8), hF: s(0), kn: s(0), ...o });
const supine = (o: Partial<Pose> = {}): Pose => ({ y: 0.47, rx: -90, spine: 0, sF: s(0), sA: s(10), el: s(10), hF: s(10), kn: s(90), ...o });

export const EXERCISES: Exercise[] = [
  {
    id: "bench_press",
    name: "Bench press",
    primary: ["dada"],
    secondary: ["bahu", "trisep"],
    equipment: "barbel",
    props: ["barbel", "bangku"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 2.6,
    a: supine({ sF: s(90), sA: s(8), el: s(0) }),
    b: supine({ sF: s(15), sA: s(72), el: s(92) }),
    steps: [
      "Berbaring di bangku, kaki menapak lantai, tulang belikat ditarik ke belakang.",
      "Turunkan barbel pelan ke dada bagian bawah, siku ±45° dari badan.",
      "Dorong ke atas sampai lengan lurus tanpa mengunci siku.",
    ],
    dose: "3–4 set × 6–10 repetisi",
  },
  {
    id: "push_up",
    name: "Push-up",
    primary: ["dada"],
    secondary: ["bahu", "trisep", "perut"],
    equipment: "badan",
    props: [],
    unit: "rep",
    weighted: false,
    view: "samping",
    period: 2.2,
    a: { y: 0.39, rx: 67, spine: 0, sF: s(90), sA: s(8), el: s(0), hF: s(0), kn: s(0) },
    b: { y: 0.15, rx: 84, spine: 0, sF: s(58), sA: s(30), el: s(100), hF: s(0), kn: s(0) },
    steps: [
      "Tangan sedikit lebih lebar dari bahu, badan lurus dari kepala sampai tumit.",
      "Turunkan dada sampai hampir menyentuh lantai.",
      "Dorong kembali ke atas. Terlalu berat? Mulai dengan lutut di lantai.",
    ],
    dose: "3 set × sebanyak mungkin, sisakan 1–2",
  },
  {
    id: "dumbbell_fly",
    name: "Dumbbell fly",
    primary: ["dada"],
    secondary: ["bahu"],
    equipment: "dumbel",
    props: ["dumbel", "bangku"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 3,
    a: supine({ sF: s(88), sA: s(4), el: s(15) }),
    b: supine({ sF: s(8), sA: s(80), el: s(22) }),
    steps: [
      "Berbaring di bangku, dumbel di atas dada, siku sedikit menekuk.",
      "Buka lengan ke samping seperti memeluk pohon besar sampai dada terasa teregang.",
      "Rapatkan kembali dengan menekan dada. Pakai beban lebih ringan dari bench press.",
    ],
    dose: "3 set × 10–15 repetisi",
  },
  {
    id: "shoulder_press",
    name: "Shoulder press",
    primary: ["bahu"],
    secondary: ["trisep", "punggung"],
    equipment: "dumbel",
    props: ["dumbel"],
    unit: "rep",
    weighted: true,
    view: "depan",
    period: 2.6,
    a: stand({ sA: s(82), sT: s(90), el: s(95) }),
    b: stand({ sA: s(165), sT: s(90), el: s(12) }),
    steps: [
      "Berdiri tegak, dumbel di samping telinga, telapak menghadap depan.",
      "Dorong ke atas sampai lengan hampir lurus di atas kepala.",
      "Turunkan pelan ke posisi awal. Jaga perut kencang, jangan melengkungkan punggung.",
    ],
    dose: "3 set × 8–12 repetisi",
  },
  {
    id: "lateral_raise",
    name: "Lateral raise",
    primary: ["bahu"],
    secondary: [],
    equipment: "dumbel",
    props: ["dumbel"],
    unit: "rep",
    weighted: true,
    view: "depan",
    period: 2.4,
    a: stand({ sA: s(10), el: s(12) }),
    b: stand({ sA: s(85), el: s(15) }),
    steps: [
      "Berdiri, dumbel di samping paha, siku sedikit menekuk.",
      "Angkat ke samping sampai setinggi bahu, seperti menuang air dari teko.",
      "Turunkan pelan. Beban ringan saja; ayunan berarti terlalu berat.",
    ],
    dose: "3 set × 12–15 repetisi",
  },
  {
    id: "biceps_curl",
    name: "Biceps curl",
    primary: ["bisep"],
    secondary: ["lengan_bawah"],
    equipment: "dumbel",
    props: ["dumbel"],
    unit: "rep",
    weighted: true,
    view: "depan",
    period: 2.2,
    a: stand({ sA: s(8), el: s(8) }),
    b: stand({ sF: s(12), sA: s(8), el: s(140) }),
    steps: [
      "Berdiri, siku menempel di samping badan, telapak menghadap depan.",
      "Tekuk siku, angkat dumbel ke arah bahu tanpa mengayun badan.",
      "Turunkan pelan sampai lengan lurus.",
    ],
    dose: "3 set × 10–12 repetisi",
  },
  {
    id: "triceps_extension",
    name: "Overhead triceps extension",
    primary: ["trisep"],
    secondary: [],
    equipment: "dumbel",
    props: ["dumbel"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 2.4,
    a: stand({ sF: s(168), sA: s(8), el: s(8) }),
    b: stand({ sF: s(168), sA: s(8), el: s(130) }),
    steps: [
      "Angkat dumbel lurus di atas kepala.",
      "Tekuk siku, turunkan dumbel ke belakang kepala. Siku tetap menunjuk ke atas.",
      "Luruskan lagi dengan mengencangkan lengan belakang.",
    ],
    dose: "3 set × 10–12 repetisi",
  },
  {
    id: "pull_up",
    name: "Pull-up",
    primary: ["punggung"],
    secondary: ["bisep", "lengan_bawah", "bahu"],
    equipment: "palang",
    props: ["palang"],
    unit: "rep",
    weighted: false,
    view: "belakang",
    period: 2.8,
    a: { y: 1.12, rx: 0, spine: 0, sF: s(0), sA: s(172), el: s(6), hF: s(10), kn: s(40) },
    b: { y: 1.5, rx: 0, spine: 0, sF: s(0), sA: s(115), sT: s(90), el: s(110), hF: s(10), kn: s(40) },
    steps: [
      "Gantung di palang, tangan sedikit lebih lebar dari bahu.",
      "Tarik badan ke atas sampai dagu melewati palang, bayangkan siku ditarik ke saku celana.",
      "Turun pelan sampai lengan lurus. Belum kuat? Pakai karet bantu atau mesin lat pulldown.",
    ],
    dose: "3 set × sebanyak mungkin (target 5–10)",
  },
  {
    id: "bent_over_row",
    name: "Bent-over row",
    primary: ["punggung"],
    secondary: ["bisep", "punggung_bawah"],
    equipment: "barbel",
    props: ["barbel"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 2.4,
    a: stand({ y: 0.86, spine: 65, sF: s(65), sA: s(6), el: s(4), hF: s(15), kn: s(22) }),
    b: stand({ y: 0.86, spine: 65, sF: s(5), sA: s(18), el: s(95), hF: s(15), kn: s(22) }),
    steps: [
      "Lutut sedikit menekuk, badan condong ke depan ±45°, punggung lurus.",
      "Tarik barbel ke arah perut bagian bawah, siku ke belakang.",
      "Turunkan pelan. Jangan menyentak dengan punggung.",
    ],
    dose: "3–4 set × 8–12 repetisi",
  },
  {
    id: "deadlift",
    name: "Deadlift",
    primary: ["punggung_bawah", "bokong", "paha_belakang"],
    secondary: ["paha_depan", "punggung", "lengan_bawah"],
    equipment: "barbel",
    props: ["barbel"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 3,
    a: stand({ sA: s(6), el: s(4) }),
    b: stand({ y: 0.62, spine: 55, sF: s(55), sA: s(6), el: s(4), hF: s(60), kn: s(70) }),
    steps: [
      "Barbel di atas tengah telapak kaki, pegang selebar bahu.",
      "Dada naik, punggung lurus, dorong lantai dengan kaki sampai berdiri tegak.",
      "Turunkan dengan mendorong pinggul ke belakang. Pelajari tekniknya dulu dengan beban ringan.",
    ],
    dose: "3 set × 5–8 repetisi",
  },
  {
    id: "squat",
    name: "Squat",
    primary: ["paha_depan", "bokong"],
    secondary: ["paha_belakang", "punggung_bawah", "perut"],
    equipment: "barbel",
    props: ["barbel"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 3,
    // tangan di belakang leher: barbel di punggung atas
    a: stand({ sF: s(35), sA: s(72), sT: s(90), el: s(140) }),
    b: stand({ y: 0.47, spine: 38, sF: s(35), sA: s(72), sT: s(90), el: s(140), hF: s(92), kn: s(108) }),
    steps: [
      "Barbel di punggung atas, kaki selebar bahu, ujung kaki sedikit keluar.",
      "Duduk ke belakang dan ke bawah sampai paha sejajar lantai, lutut searah jari kaki.",
      "Dorong naik lewat tumit. Belum pakai barbel? Mulai tanpa beban atau pegang dumbel di dada.",
    ],
    dose: "3–4 set × 6–10 repetisi",
  },
  {
    id: "lunge",
    name: "Lunge",
    primary: ["paha_depan", "bokong"],
    secondary: ["paha_belakang", "betis"],
    equipment: "dumbel",
    props: ["dumbel"],
    unit: "rep",
    weighted: true,
    view: "samping",
    period: 2.8,
    a: stand({ y: 0.88, hF: [25, -15], kn: [10, 15] }),
    b: stand({ y: 0.53, hF: [80, -10], kn: [85, 100] }),
    steps: [
      "Langkahkan satu kaki ke depan, badan tegak.",
      "Turunkan badan sampai lutut belakang hampir menyentuh lantai.",
      "Dorong kembali dengan kaki depan. Ganti kaki tiap repetisi atau tiap set.",
    ],
    dose: "3 set × 10 repetisi per kaki",
  },
  {
    id: "glute_bridge",
    name: "Glute bridge",
    primary: ["bokong"],
    secondary: ["paha_belakang"],
    equipment: "badan",
    props: [],
    unit: "rep",
    weighted: false,
    view: "samping",
    period: 2.4,
    a: { y: 0.11, rx: -90, spine: 0, sF: s(0), sA: s(12), el: s(5), hF: s(55), kn: s(110) },
    b: { y: 0.36, rx: -62, spine: 0, sF: s(25), sA: s(12), el: s(5), hF: s(28), kn: s(110) },
    steps: [
      "Berbaring telentang, lutut ditekuk, telapak kaki menapak.",
      "Angkat pinggul sampai badan lurus dari bahu ke lutut, kencangkan bokong di atas.",
      "Turunkan pelan. Bisa ditambah beban di pinggul (hip thrust).",
    ],
    dose: "3 set × 12–15 repetisi",
  },
  {
    id: "crunch",
    name: "Crunch",
    primary: ["perut"],
    secondary: [],
    equipment: "badan",
    props: [],
    unit: "rep",
    weighted: false,
    view: "samping",
    period: 2.2,
    a: { y: 0.11, rx: -90, spine: 0, sF: s(35), sA: s(-5), el: s(140), hF: s(50), kn: s(100) },
    b: { y: 0.11, rx: -90, spine: 38, sF: s(35), sA: s(-5), el: s(140), hF: s(50), kn: s(100) },
    steps: [
      "Berbaring, lutut ditekuk, tangan menyilang di dada.",
      "Gulung bahu naik dari lantai dengan mengencangkan perut, punggung bawah tetap menempel.",
      "Turunkan pelan. Perut rata lebih ditentukan pola makan daripada jumlah crunch.",
    ],
    dose: "3 set × 15–20 repetisi",
  },
  {
    id: "plank",
    name: "Plank",
    primary: ["perut"],
    secondary: ["bahu", "punggung_bawah"],
    equipment: "badan",
    props: [],
    unit: "detik",
    weighted: false,
    view: "samping",
    period: 3.4,
    a: { y: 0.27, rx: 79, spine: 0, sF: s(88), sA: s(8), el: s(90), hF: s(0), kn: s(0) },
    b: { y: 0.29, rx: 78, spine: 0, sF: s(88), sA: s(8), el: s(90), hF: s(0), kn: s(0) },
    steps: [
      "Tumpu pada lengan bawah dan ujung kaki, siku tepat di bawah bahu.",
      "Badan lurus seperti papan: pinggul tidak naik dan tidak melorot.",
      "Tahan sambil tetap bernapas.",
    ],
    dose: "3 set × 30–60 detik",
  },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function exercisesFor(target: string) {
  const t = TARGETS.find((x) => x.key === target);
  if (!t) return [];
  const prim = EXERCISES.filter((e) => e.primary.some((m) => t.muscles.includes(m)));
  const sec = EXERCISES.filter((e) => !prim.includes(e) && e.secondary.some((m) => t.muscles.includes(m)));
  return [...prim, ...sec];
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (x: number, y: number) => x + (y - x) * t;
  const ls = (x: Side | undefined, y: Side | undefined): Side => {
    const p = x ?? [0, 0],
      q = y ?? [0, 0];
    return [l(p[0], q[0]), l(p[1], q[1])];
  };
  return {
    y: l(a.y, b.y),
    z: l(a.z ?? 0, b.z ?? 0),
    rx: l(a.rx, b.rx),
    spine: l(a.spine, b.spine),
    sF: ls(a.sF, b.sF),
    sA: ls(a.sA, b.sA),
    sT: ls(a.sT, b.sT),
    el: ls(a.el, b.el),
    hF: ls(a.hF, b.hF),
    hA: ls(a.hA, b.hA),
    kn: ls(a.kn, b.kn),
  };
}

export const STAND: Pose = stand();
