import { test } from "node:test";
import assert from "node:assert/strict";
import { EXERCISES, EXERCISE_BY_ID as E } from "./exercises.ts";
import { applyPose, createSkeleton, worldPos } from "./rig.ts";

const dims = { shX: 0.19, hipX: 0.09 };
const at = (id: string, which: "a" | "b") => {
  const sk = createSkeleton();
  applyPose(sk, E[id][which], dims);
  const p = (o: import("three").Object3D) => worldPos(o);
  return {
    footY: Math.min(p(sk.foot[0]).y, p(sk.foot[1]).y),
    handY: Math.max(p(sk.hand[0]).y, p(sk.hand[1]).y),
    hand: p(sk.hand[0]),
    shoulder: p(sk.sh[0]),
    head: p(sk.neck),
    pelvis: p(sk.root),
  };
};

test("kaki menapak lantai di semua gerakan berdiri & berbaring", () => {
  for (const e of EXERCISES) {
    if (e.id === "pull_up") continue;
    for (const w of ["a", "b"] as const) {
      const r = at(e.id, w);
      // berbaring/telungkup: kaki boleh sedikit di atas lantai (tumit/ujung kaki)
      assert.ok(r.footY > -0.06 && r.footY < 0.16, `${e.id} ${w}: kaki y=${r.footY.toFixed(2)}`);
    }
  }
});

test("pose masuk akal", () => {
  // bench press: tangan di atas dada saat lengan lurus
  assert.ok(at("bench_press", "a").handY > at("bench_press", "a").shoulder.y + 0.4);
  // shoulder press: atas → tangan di atas kepala; bawah → setinggi telinga
  assert.ok(at("shoulder_press", "b").handY > at("shoulder_press", "b").head.y + 0.15, "press atas");
  const low = at("shoulder_press", "a");
  assert.ok(low.handY > low.shoulder.y && low.handY < low.shoulder.y + 0.3, `press bawah ${low.handY.toFixed(2)} vs ${low.shoulder.y.toFixed(2)}`);
  // biceps curl: tangan naik mendekati bahu
  assert.ok(at("biceps_curl", "b").handY > at("biceps_curl", "a").handY + 0.3);
  // push-up: tangan di lantai
  assert.ok(at("push_up", "a").hand.y < 0.12, `push-up tangan ${at("push_up", "a").hand.y.toFixed(2)}`);
  // squat bawah: panggul lebih rendah dari lutut berdiri
  assert.ok(at("squat", "b").pelvis.y < 0.55);
  // pull-up: tangan di palang (±2,2 m) saat menggantung
  assert.ok(Math.abs(at("pull_up", "a").handY - 2.2) < 0.15, `pull-up ${at("pull_up", "a").handY.toFixed(2)}`);
});
