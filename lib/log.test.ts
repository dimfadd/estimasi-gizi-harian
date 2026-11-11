import { test } from "node:test";
import assert from "node:assert/strict";
import { LOG_ITEMS, nutrientsOf, shiftDate, sumNutrients } from "./log.ts";

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
  assert.equal(nutrientsOf("es_teh", 1, 1, true)!.kcal, 110); // tidak bisa digoreng
  assert.equal(nutrientsOf("x", 1, 1, false), null);
  assert.equal(sumNutrients([nasi, tempe]).kcal, 393);
});

test("tanggal mundur melewati bulan", () => {
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDate("2026-11-11", -6), "2026-11-05");
});
