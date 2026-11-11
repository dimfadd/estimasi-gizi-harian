import { test } from "node:test";
import assert from "node:assert/strict";
import { LOG_ITEMS, nutrientsOf, shiftDate, sugarOf, sumNutrients } from "./log.ts";
const awaitImport = { sugarOf };

test("semua item catatan punya gizi lengkap", () => {
  for (const i of LOG_ITEMS) {
    for (const k of ["kcal", "p", "c", "f", "fb"] as const) assert.ok(Number.isFinite(i[k]), `${i.id}.${k}`);
    const fromMacro = i.p * 4 + i.c * 4 + i.f * 9;
    assert.ok(Math.abs(fromMacro - i.kcal) <= Math.max(25, i.kcal * 0.2), `${i.id}: ${i.kcal} vs makro ${fromMacro}`);
  }
});

test("nasi 1½ kepal & goreng menambah lemak", () => {
  const nasi = nutrientsOf("nasi_putih", 1.5, 1, false)!;
  assert.equal(nasi.kcal, 293);
  const tempe = nutrientsOf("tempe", 1, 1, false)!;
  const tempeGoreng = nutrientsOf("tempe", 1, 1, true)!;
  assert.equal(tempeGoreng.kcal - tempe.kcal, 45);
  assert.equal(nutrientsOf("teh", 1, 1, true, 2)!.kcal, 74); // tidak bisa digoreng, gula 18 g
  assert.equal(nutrientsOf("x", 1, 1, false), null);
  assert.equal(sumNutrients([nasi, tempe]).kcal, 393);
});

test("tanggal mundur melewati bulan", () => {
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDate("2026-11-11", -6), "2026-11-05");
});

test("minuman: gula sesuai tingkat manis, air 0 kkal", () => {
  const { sugarOf } = awaitImport;
  assert.equal(nutrientsOf("teh", 1, 1, false, 0)!.kcal, 2);
  assert.equal(nutrientsOf("teh", 1, 1, false, 3)!.kcal, 122);
  // cup plastik kopi susu manis sekali = 2 gelas
  assert.equal(nutrientsOf("kopi_susu", 2, 1, false, 3)!.kcal, 380);
  assert.equal(sugarOf("kopi_susu", 2, 3), 60);
  assert.equal(nutrientsOf("air", 3, 1, false, 3)!.kcal, 0);
  assert.equal(sugarOf("air", 3, 3), 0);
  // gelas tidak ikut skala tangan
  assert.equal(nutrientsOf("susu_gelas", 1, 0.8, false, 0)!.kcal, 150);
});
