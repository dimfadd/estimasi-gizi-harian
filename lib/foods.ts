// Katalog makanan dan ukuran porsi berbasis tangan.
//
// Angka gizi diambil dari Tabel Komposisi Pangan Indonesia (TKPI) dan USDA,
// dibulatkan. "grams" untuk satuan tangan berlaku untuk tangan pria dewasa
// rata-rata (tinggi ±170 cm); nilainya diskalakan lagi di nutrition.ts sesuai
// tinggi & jenis kelamin. Satuan hitung (butir, ekor, potong) tidak diskalakan.

export type Group = "karbo" | "protein" | "sayur" | "lemak" | "buah" | "minum";

export type Unit =
  | "kepal"
  | "telapak"
  | "ibu jari"
  | "genggam"
  | "butir"
  | "potong"
  | "ekor"
  | "tongkol"
  | "lembar"
  | "buah"
  | "gelas";

export interface Food {
  id: string;
  name: string;
  group: Group;
  unit: Unit;
  /** true = ukurannya ikut tangan orangnya (kepal, telapak, ibu jari, genggam) */
  hand: boolean;
  /** berat bagian yang dimakan per 1 satuan, gram */
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** batas wajar per sekali makan; di atas ini opsi disembunyikan */
  max: number;
  /** pembulatan: 1 = bilangan bulat, 0.5 = setengah */
  step: 1 | 0.5;
  /** cara menakar dengan mata/tangan */
  howTo: string;
}

export const FOODS: Record<string, Food> = {
  // ---------- karbohidrat ----------
  nasi_putih: {
    id: "nasi_putih", name: "Nasi putih", group: "karbo", unit: "kepal", hand: true,
    grams: 150, kcal: 195, p: 4, c: 43, f: 0.4, max: 4, step: 0.5,
    howTo: "Padatkan nasi seukuran kepalan tanganmu sendiri. Kira-kira 1½ centong nasi.",
  },
  nasi_merah: {
    id: "nasi_merah", name: "Nasi merah", group: "karbo", unit: "kepal", hand: true,
    grams: 150, kcal: 165, p: 4, c: 35, f: 1.3, max: 4, step: 0.5,
    howTo: "Sama seperti nasi putih: satu kepalan tangan.",
  },
  jagung: {
    id: "jagung", name: "Jagung rebus", group: "karbo", unit: "tongkol", hand: false,
    grams: 100, kcal: 96, p: 3.4, c: 21, f: 1.5, max: 4, step: 0.5,
    howTo: "Satu tongkol sedang, kira-kira sepanjang telapak sampai ujung jari.",
  },
  ubi: {
    id: "ubi", name: "Ubi rebus", group: "karbo", unit: "kepal", hand: true,
    grams: 150, kcal: 130, p: 2.4, c: 30, f: 0.2, max: 4, step: 0.5,
    howTo: "Potongan ubi sebesar kepalan tangan.",
  },
  kentang: {
    id: "kentang", name: "Kentang rebus", group: "karbo", unit: "kepal", hand: true,
    grams: 150, kcal: 130, p: 3, c: 30, f: 0.2, max: 4, step: 0.5,
    howTo: "Satu kentang sebesar kepalan tangan (bukan digoreng).",
  },
  singkong: {
    id: "singkong", name: "Singkong rebus", group: "karbo", unit: "kepal", hand: true,
    grams: 120, kcal: 190, p: 1.5, c: 45, f: 0.4, max: 3, step: 0.5,
    howTo: "Singkong padat dan berat. Satu kepal singkong lebih 'mengenyangkan kalori' dari nasi.",
  },
  oat: {
    id: "oat", name: "Oat (kering)", group: "karbo", unit: "genggam", hand: true,
    grams: 40, kcal: 150, p: 5, c: 27, f: 2.6, max: 3, step: 0.5,
    howTo: "Satu genggam penuh (telapak ditekuk seperti mangkuk) oat sebelum dimasak.",
  },
  roti: {
    id: "roti", name: "Roti gandum", group: "karbo", unit: "lembar", hand: false,
    grams: 30, kcal: 75, p: 3.5, c: 13, f: 1, max: 4, step: 1,
    howTo: "Satu lembar roti tawar gandum ukuran biasa.",
  },

  // ---------- lauk / protein ----------
  telur: {
    id: "telur", name: "Telur ayam", group: "protein", unit: "butir", hand: false,
    grams: 55, kcal: 75, p: 6.5, c: 0.5, f: 5, max: 3, step: 1,
    howTo: "Telur ayam ras ukuran biasa. Rebus/ceplok sedikit minyak.",
  },
  dada_ayam: {
    id: "dada_ayam", name: "Dada ayam", group: "protein", unit: "telapak", hand: true,
    grams: 100, kcal: 165, p: 31, c: 0, f: 3.6, max: 2, step: 0.5,
    howTo: "Selebar dan setebal telapak tanganmu (tanpa jari), sudah matang, tanpa kulit.",
  },
  paha_atas: {
    id: "paha_atas", name: "Paha atas ayam", group: "protein", unit: "potong", hand: false,
    grams: 70, kcal: 135, p: 18, c: 0, f: 7, max: 2, step: 1,
    howTo: "1 potong paha atas ukuran sedang (ayam 1 kg dipotong 8). Buang kulitnya.",
  },
  paha_bawah: {
    id: "paha_bawah", name: "Paha bawah ayam", group: "protein", unit: "potong", hand: false,
    grams: 50, kcal: 95, p: 13, c: 0, f: 4.5, max: 3, step: 1,
    howTo: "1 potong paha bawah (drumstick) ukuran sedang, tanpa kulit.",
  },
  kembung: {
    id: "kembung", name: "Ikan kembung", group: "protein", unit: "ekor", hand: false,
    grams: 80, kcal: 95, p: 17, c: 0, f: 2.5, max: 2, step: 0.5,
    howTo: "1 ekor sedang, kira-kira sepanjang telapak sampai ujung jari tengah.",
  },
  lele: {
    id: "lele", name: "Ikan lele", group: "protein", unit: "ekor", hand: false,
    grams: 100, kcal: 105, p: 18, c: 0, f: 4.5, max: 2, step: 0.5,
    howTo: "1 ekor ukuran warung (5–6 ekor per kg). Kalau digoreng, hitung tambahan minyak.",
  },
  nila: {
    id: "nila", name: "Ikan nila", group: "protein", unit: "ekor", hand: false,
    grams: 120, kcal: 115, p: 24, c: 0, f: 2.5, max: 1.5, step: 0.5,
    howTo: "1 ekor sedang (3–4 ekor per kg), kira-kira sebesar telapak + jari.",
  },
  ikan_potong: {
    id: "ikan_potong", name: "Tongkol / tuna / patin", group: "protein", unit: "telapak", hand: true,
    grams: 100, kcal: 120, p: 24, c: 0, f: 2, max: 2, step: 0.5,
    howTo: "Potongan ikan selebar dan setebal telapak tanganmu.",
  },
  daging: {
    id: "daging", name: "Daging sapi", group: "protein", unit: "telapak", hand: true,
    grams: 100, kcal: 200, p: 26, c: 0, f: 10, max: 1.5, step: 0.5,
    howTo: "Daging tanpa gajih, selebar dan setebal telapak tangan.",
  },
  tempe: {
    id: "tempe", name: "Tempe", group: "protein", unit: "telapak", hand: true,
    grams: 50, kcal: 100, p: 10, c: 4, f: 4.4, max: 3, step: 0.5,
    howTo: "Selebar telapak, setebal jari kelingking. Kira-kira 2 potong tempe warung.",
  },
  tahu: {
    id: "tahu", name: "Tahu", group: "protein", unit: "potong", hand: false,
    grams: 80, kcal: 64, p: 8.7, c: 1.5, f: 3.8, max: 3, step: 1,
    howTo: "1 potong tahu putih ukuran pasar (±6×6 cm).",
  },

  // ---------- sayur, lemak, buah, minum ----------
  sayur: {
    id: "sayur", name: "Sayur", group: "sayur", unit: "kepal", hand: true,
    grams: 90, kcal: 25, p: 1.5, c: 4, f: 0.2, max: 4, step: 0.5,
    howTo: "Sayur matang/mentah sebesar kepalan. Bayam, kangkung, buncis, sawi, wortel, terong.",
  },
  minyak: {
    id: "minyak", name: "Minyak / santan / mentega", group: "lemak", unit: "ibu jari", hand: true,
    grams: 10, kcal: 90, p: 0, c: 0, f: 10, max: 4, step: 0.5,
    howTo: "Seukuran ruas ibu jari ≈ 1 sendok makan. Lauk goreng menyerap ±½–1 ibu jari minyak.",
  },
  pisang: {
    id: "pisang", name: "Pisang", group: "buah", unit: "buah", hand: false,
    grams: 100, kcal: 90, p: 1.1, c: 23, f: 0.3, max: 2, step: 1,
    howTo: "1 buah pisang ambon/raja ukuran sedang.",
  },
  air: {
    id: "air", name: "Air putih", group: "minum", unit: "gelas", hand: false,
    grams: 250, kcal: 0, p: 0, c: 0, f: 0, max: 20, step: 1,
    howTo: "Gelas belimbing ±250 ml.",
  },
};

export const CARB_IDS = ["nasi_putih", "nasi_merah", "jagung", "ubi", "kentang", "singkong", "oat", "roti"];
export const PROTEIN_IDS = [
  "telur", "dada_ayam", "paha_atas", "paha_bawah", "kembung", "lele", "nila", "ikan_potong", "daging", "tempe", "tahu",
];

/** Kombinasi lauk: protein dibagi rata ke dua sumber. */
export const PROTEIN_COMBOS: [string, string][] = [
  ["telur", "tempe"],
  ["telur", "tahu"],
  ["paha_atas", "tempe"],
  ["kembung", "tahu"],
  ["tempe", "tahu"],
];

export interface Snack {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  p: number;
  /** true = pilihan yang membantu target; false = jebakan */
  good: boolean;
}

export const SNACKS: Snack[] = [
  { id: "pisang", name: "Pisang", portion: "1 buah", kcal: 90, p: 1, good: true },
  { id: "telur_rebus", name: "Telur rebus", portion: "1 butir", kcal: 75, p: 6.5, good: true },
  { id: "yogurt", name: "Yogurt plain", portion: "1 cup kecil", kcal: 100, p: 6, good: true },
  { id: "susu", name: "Susu UHT plain", portion: "1 kotak 200 ml", kcal: 120, p: 6, good: true },
  { id: "kacang", name: "Kacang tanah sangrai", portion: "1 genggam kecil", kcal: 170, p: 7, good: true },
  { id: "ubi_rebus", name: "Ubi rebus", portion: "1 kepal", kcal: 130, p: 2, good: true },
  { id: "gorengan", name: "Gorengan (bakwan/tempe mendoan)", portion: "1 biji", kcal: 140, p: 3, good: false },
  { id: "es_teh", name: "Es teh manis", portion: "1 gelas", kcal: 110, p: 0, good: false },
  { id: "kopi_susu", name: "Kopi susu gula aren", portion: "1 gelas plastik", kcal: 230, p: 4, good: false },
  { id: "keripik", name: "Keripik kemasan", portion: "1 bungkus 60 g", kcal: 320, p: 3, good: false },
  { id: "martabak", name: "Martabak manis", portion: "1 potong", kcal: 300, p: 5, good: false },
  { id: "mie_instan", name: "Mi instan goreng", portion: "1 bungkus", kcal: 390, p: 8, good: false },
];
