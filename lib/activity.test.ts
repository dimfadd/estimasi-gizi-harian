import { test } from "node:test";
import assert from "node:assert/strict";
import { cardioKcal, fmtPace, restKcal, strengthKcal, volumeKg } from "./activity.ts";

test("lari 5 km 30 menit, 83 kg ≈ 1 kkal/kg/km", () => {
  const k = cardioKcal({ activityId: "lari", minutes: 30, km: 5 }, 83);
  assert.ok(k > 380 && k < 470, String(k));
});

test("badminton 60 menit sedang", () => {
  assert.equal(cardioKcal({ activityId: "badminton", minutes: 60, intensity: "sedang" }, 70), Math.round(5.5 * 1.05 * 70));
});

test("latihan beban 4 set", () => {
  const sets = [{ kg: 40, reps: 10 }, { kg: 40, reps: 10 }, { kg: 45, reps: 8 }, { kg: 45, reps: 8 }];
  assert.equal(volumeKg(sets), 1520);
  assert.equal(strengthKcal(sets, 83), Math.round(5 * 1.05 * 83 * (10 / 60)));
  assert.ok(restKcal(10, 83) < strengthKcal(sets, 83));
});

test("format pace", () => {
  assert.equal(fmtPace(5.5), "5:30");
  assert.equal(fmtPace(6), "6:00");
  assert.equal(fmtPace(0), "–");
});
