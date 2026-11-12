// Kerangka (rig) manekin: dipakai komponen 3D dan tes pose.
import { Object3D, Quaternion, Vector3 } from "three";
import type { Pose } from "./exercises.ts";

export const BONE = { thigh: 0.42, shin: 0.42, upper: 0.28, fore: 0.26, spineToShoulder: 0.46, pelvisToSpine: 0.04, hipDrop: 0.03 };

export interface Dims {
  /** setengah lebar bahu */
  shX: number;
  /** jarak sendi pinggul dari tengah */
  hipX: number;
}

export interface Skeleton {
  root: Object3D;
  spine: Object3D;
  neck: Object3D;
  sh: [Object3D, Object3D];
  el: [Object3D, Object3D];
  hand: [Object3D, Object3D];
  hip: [Object3D, Object3D];
  knee: [Object3D, Object3D];
  foot: [Object3D, Object3D];
}

const D2R = Math.PI / 180;
const X = new Vector3(1, 0, 0),
  Y = new Vector3(0, 1, 0),
  Z = new Vector3(0, 0, 1);
const qa = new Quaternion(),
  qb = new Quaternion(),
  qc = new Quaternion();

/** Rotasi sendi bola: angkat ke depan, buka ke samping, putar pada sumbu tulang. */
function ball(obj: Object3D, flex: number, abd: number, twist: number, side: number) {
  qa.setFromAxisAngle(X, -flex * D2R);
  qb.setFromAxisAngle(Z, side * abd * D2R);
  qc.setFromAxisAngle(Y, side * twist * D2R);
  obj.quaternion.copy(qa).multiply(qb).multiply(qc);
}

/** Pasang pose ke kerangka. Sisi 0 = kiri manekin (x positif), 1 = kanan. */
export function applyPose(sk: Skeleton, p: Pose, d: Dims) {
  sk.root.position.set(0, p.y, p.z ?? 0);
  sk.root.rotation.set(p.rx * D2R, 0, 0);
  sk.spine.position.set(0, BONE.pelvisToSpine, 0);
  sk.spine.rotation.set(p.spine * D2R, 0, 0);
  sk.neck.position.set(0, BONE.spineToShoulder + 0.04, 0);
  for (const i of [0, 1] as const) {
    const side = i === 0 ? 1 : -1;
    sk.sh[i].position.set(side * d.shX, BONE.spineToShoulder, 0);
    ball(sk.sh[i], p.sF[i], p.sA[i], p.sT?.[i] ?? 0, side);
    sk.el[i].position.set(0, -BONE.upper, 0);
    sk.el[i].rotation.set(-p.el[i] * D2R, 0, 0);
    sk.hand[i].position.set(0, -BONE.fore, 0);
    sk.hip[i].position.set(side * d.hipX, -BONE.hipDrop, 0);
    ball(sk.hip[i], p.hF[i], p.hA?.[i] ?? 0, 0, side);
    sk.knee[i].position.set(0, -BONE.thigh, 0);
    sk.knee[i].rotation.set(p.kn[i] * D2R, 0, 0);
    sk.foot[i].position.set(0, -BONE.shin, 0);
  }
}

/** Kerangka tanpa mesh (untuk tes & perhitungan). */
export function createSkeleton(): Skeleton {
  const o = () => new Object3D();
  const sk: Skeleton = {
    root: o(),
    spine: o(),
    neck: o(),
    sh: [o(), o()],
    el: [o(), o()],
    hand: [o(), o()],
    hip: [o(), o()],
    knee: [o(), o()],
    foot: [o(), o()],
  };
  sk.root.add(sk.spine, sk.hip[0], sk.hip[1]);
  sk.spine.add(sk.neck, sk.sh[0], sk.sh[1]);
  for (const i of [0, 1] as const) {
    sk.sh[i].add(sk.el[i]);
    sk.el[i].add(sk.hand[i]);
    sk.hip[i].add(sk.knee[i]);
    sk.knee[i].add(sk.foot[i]);
  }
  return sk;
}

export function worldPos(obj: Object3D) {
  obj.updateWorldMatrix(true, false);
  return new Vector3().setFromMatrixPosition(obj.matrixWorld);
}
