import { test } from "node:test";
import assert from "node:assert/strict";
import { customItem, LOG_BY_ID as F, LOG_ITEMS, nutrientsOf, shiftDate, sugarOf, sumNutrients } from "./log.ts";

test("semua id unik & punya ikon", () => {
  const ids = new Set(LOG_ITEMS.map((i) => i.id));
  assert.equal(ids.size, LOG_ITEMS.length);
});

test("nasi 1½ kepal & goreng menambah lemak", () => {
  const nasi = nutrientsOf(F.nasi_putih, 1.5, 1, false)!;
  assert.equal(nasi.kcal, 293);
  const tempe = nutrientsOf(F.tempe, 1, 1, false)!;
  assert.equal(nutrientsOf(F.tempe, 1, 1, true)!.kcal - tempe.kcal, 45);
  assert.equal(nutrientsOf(F.teh, 1, 1, true, 2)!.kcal, 74); // teh tidak bisa digoreng, gula 18 g
  assert.equal(nutrientsOf(undefined, 1, 1, false), null);
  assert.equal(sumNutrients([nasi, tempe]).kcal, 393);
});

test("minuman: gula sesuai tingkat manis, air 0 kkal", () => {
  assert.equal(nutrientsOf(F.teh, 1, 1, false, 0)!.kcal, 2);
  assert.equal(nutrientsOf(F.teh, 1, 1, false, 3)!.kcal, 122);
  assert.equal(nutrientsOf(F.kopi_susu, 2, 1, false, 3)!.kcal, 380);
  assert.equal(sugarOf(F.kopi_susu, 2, 3), 60);
  assert.equal(nutrientsOf(F.air, 3, 1, false, 3)!.kcal, 0);
  assert.equal(nutrientsOf(F.susu_gelas, 1, 0.8, false, 0)!.kcal, 150); // gelas tidak ikut skala tangan
});

test("gula bawaan minuman kemasan ikut terhitung", () => {
  assert.equal(nutrientsOf(F.teh_kemasan, 1, 1, false)!.sugar, 30);
  assert.equal(nutrientsOf(F.kecap_manis, 2, 1, false)!.sugar, 18);
});

test("makanan buatan sendiri", () => {
  const it = customItem({ id: 7, name: "Nasi kucing", unit: "bungkus", kcal: 250, protein: 6, carb: 40, fat: 7, fiber: 1 });
  assert.equal(it.id, "u:7");
  assert.equal(nutrientsOf(it, 2, 1.1, true)!.kcal, 500); // tidak bisa digoreng, tidak ikut skala tangan
});

test("tanggal mundur melewati bulan", () => {
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDate("2026-11-11", -6), "2026-11-05");
});
