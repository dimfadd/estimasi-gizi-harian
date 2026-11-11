import { test } from "node:test";
import assert from "node:assert/strict";
import { FOOD_DB } from "./fooddb.ts";
import { searchFoods } from "./search.ts";

const top = (q: string) => searchFoods(FOOD_DB, q, 5).map((x) => x.id);

test("cari nama umum", () => {
  assert.equal(top("nasi")[0], "nasi_putih");
  assert.ok(top("ayam bakar").includes("ayam_bakar"));
  assert.ok(top("bakar ayam").includes("ayam_bakar"));
  assert.ok(top("es teh").includes("teh"));
});

test("nama lain & merek", () => {
  assert.ok(top("indomie").includes("mie_instan"));
  assert.ok(top("nasgor").includes("nasi_goreng"));
  assert.ok(top("kfc").includes("ayam_goreng_tepung"));
  assert.ok(top("pocari").includes("isotonik"));
});

test("toleran salah ketik", () => {
  assert.ok(top("kangkong").includes("tumis_kangkung"), String(top("kangkong")));
  assert.ok(top("tempee").includes("tempe"), String(top("tempee")));
  assert.ok(top("rendag").includes("rendang"), String(top("rendag")));
});

test("tidak ada hasil untuk yang tidak ada", () => {
  assert.deepEqual(top("zzzqqq"), []);
});

test("data makanan masuk akal", () => {
  for (const f of FOOD_DB) {
    const fromMacro = f.p * 4 + f.c * 4 + f.f * 9;
    assert.ok(Math.abs(fromMacro - f.kcal) <= Math.max(30, f.kcal * 0.2), `${f.id}: ${f.kcal} vs makro ${Math.round(fromMacro)}`);
  }
});
