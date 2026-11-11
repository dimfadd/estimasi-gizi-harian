import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, fmtAmount, plateFor, plateTotals, sanitizeInput, type PlanInput } from "./nutrition.ts";

const dimas: PlanInput = {
  name: "Contoh", sex: "pria", age: 26, heightCm: 168, weightKg: 83,
  work: "duduk", exercise: 2, goal: "turun", changeKg: 8, pace: "sedang", meals: 3,
};

test("fmtAmount", () => {
  assert.equal(fmtAmount(0.5), "½");
  assert.equal(fmtAmount(1.5), "1½");
  assert.equal(fmtAmount(2), "2");
});

test("pria 168/83 turun 0.5 kg/minggu", () => {
  const p = buildPlan(dimas);
  assert.equal(p.bmr, 1755);
  assert.ok(p.tdee > 2300 && p.tdee < 2400, `tdee ${p.tdee}`);
  assert.ok(p.targetKcal > 1750 && p.targetKcal < 1900, `kcal ${p.targetKcal}`);
  assert.ok(p.proteinG >= 120 && p.proteinG <= 135, `protein ${p.proteinG}`);
  assert.equal(p.meals.length, 3);
  assert.ok(p.weeksToGoal === 16 || p.weeksToGoal === 17);
  for (const m of p.meals) {
    assert.ok(plateFor(m, m.defaultProtein).carbOptions.length > 0, `${m.key} carb options`);
    assert.ok(m.proteinOptions.length > 0, `${m.key} protein options`);
    assert.ok(m.proteinOptions.some((o) => o.key === m.defaultProtein));
  }
});

test("kalori tidak turun di bawah batas", () => {
  const p = buildPlan({ ...dimas, sex: "wanita", heightCm: 150, weightKg: 48, age: 60, pace: "cepat" });
  assert.ok(p.targetKcal >= 1200);
  assert.ok(p.notes.length > 0);
});

test("otot dengan lemak tinggi = rekomposisi", () => {
  assert.equal(buildPlan({ ...dimas, goal: "otot" }).mode, "rekomposisi");
  assert.equal(buildPlan({ ...dimas, goal: "otot", weightKg: 62 }).mode, "surplus");
});

test("sanitizeInput menolak data rusak", () => {
  assert.equal(sanitizeInput({ ...dimas, age: 300 }), null);
  assert.equal(sanitizeInput({ ...dimas, goal: "x" }), null);
  assert.deepEqual(sanitizeInput(dimas), dimas);
});

for (const goal of ["turun", "jaga", "naik", "otot"] as const) {
  for (const sex of ["pria", "wanita"] as const) {
    test(`total piring dekat target: ${goal} ${sex}`, () => {
      const p = buildPlan({ ...dimas, goal, sex, weightKg: sex === "pria" ? 83 : 60, heightCm: sex === "pria" ? 168 : 156 });
      const day = p.meals.map((m) => plateTotals(m, m.defaultCarb, m.defaultProtein));
      const kcal = day.reduce((s, d) => s + d.kcal, 0) + p.snackKcal;
      const prot = day.reduce((s, d) => s + d.p, 0);
      console.log(goal, sex, "target", p.targetKcal, "piring+camilan", kcal, "protein", prot, "/", p.proteinG);
      assert.ok(Math.abs(kcal - p.targetKcal) / p.targetKcal < 0.1, `kcal ${kcal} vs ${p.targetKcal}`);
      assert.ok(prot >= p.proteinG * 0.85, `protein ${prot} vs ${p.proteinG}`);
    });
  }
}
