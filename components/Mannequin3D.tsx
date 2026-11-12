"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerpPose, STAND, type Exercise, type Muscle, type Pose } from "@/lib/exercises";
import type { Sex } from "@/lib/nutrition";
import { applyPose, BONE, createSkeleton, type Dims, type Skeleton } from "@/lib/rig";

export interface BodyShape {
  sex: Sex;
  heightCm: number;
  bmi: number;
  bodyFatPct: number;
}

const SKIN = "#D7A982";
const CLOTH = "#1C1C1C";
const HAIR = "#2A2622";
const PRIMARY = "#E5322D";
const SECONDARY = "#F4847C";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

type Part =
  | "pelvis"
  | "glutes"
  | "abs"
  | "lowerback"
  | "pecs"
  | "upperback"
  | "bust"
  | "delt"
  | "upperarm"
  | "forearm"
  | "thigh"
  | "shin";

const MUSCLE_PART: Record<Muscle, Part[]> = {
  dada: ["pecs", "bust"],
  bahu: ["delt"],
  bisep: ["upperarm"],
  trisep: ["upperarm"],
  lengan_bawah: ["forearm"],
  punggung: ["upperback"],
  punggung_bawah: ["lowerback"],
  perut: ["abs"],
  bokong: ["glutes"],
  paha_depan: ["thigh"],
  paha_belakang: ["thigh"],
  betis: ["shin"],
};

interface Built {
  sk: Skeleton;
  dims: Dims;
  mats: Record<Part, THREE.MeshStandardMaterial>;
  base: Record<Part, string>;
  barbell: THREE.Group | null;
}

const mat = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });
const sphere = new THREE.SphereGeometry(1, 36, 24);

function blob(m: THREE.Material, p: [number, number, number], r: [number, number, number]) {
  const mesh = new THREE.Mesh(sphere, m);
  mesh.position.set(...p);
  mesh.scale.set(...r);
  mesh.castShadow = true;
  return mesh;
}

function limb(m: THREE.Material, length: number, r: number, yCenter: number, zOff = 0) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, length), 8, 24), m);
  mesh.position.set(0, yCenter, zOff);
  mesh.castShadow = true;
  return mesh;
}

function dumbbell() {
  const g = new THREE.Group();
  const iron = mat("#2B2B2B");
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.17, 12), mat("#9A9A9A"));
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  for (const x of [-0.075, 0.075]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20), iron);
    plate.rotation.z = Math.PI / 2;
    plate.position.x = x;
    g.add(plate);
  }
  return g;
}

function barbell() {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.7, 12), mat("#A8A8A8"));
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  for (const x of [-0.62, -0.68, 0.62, 0.68]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 28), mat("#262626"));
    plate.rotation.z = Math.PI / 2;
    plate.position.x = x;
    plate.castShadow = true;
    g.add(plate);
  }
  return g;
}

function build(shape: BodyShape, ex: Exercise | null): Built {
  const f = shape.sex === "wanita";
  const w = clamp(Math.sqrt(shape.bmi / 22), 0.82, 1.55);
  const belly = clamp((shape.bodyFatPct - (f ? 24 : 15)) / 14, 0, 1.6);
  const hip = f ? clamp((shape.bodyFatPct - 20) / 25, 0, 1.2) : belly * 0.4;
  const dims: Dims = {
    shX: 0.19 * Math.sqrt(w) * (f ? 0.88 : 1),
    hipX: 0.085 * w * (f ? 1.12 : 1) + hip * 0.02,
  };
  const thighR = 0.068 * w * (f ? 1.06 : 1) + hip * 0.012;
  const armR = 0.04 * Math.pow(w, 0.8);

  const base: Record<Part, string> = {
    pelvis: CLOTH,
    glutes: CLOTH,
    abs: SKIN,
    lowerback: SKIN,
    pecs: f ? CLOTH : SKIN, // wanita memakai sport bra
    bust: CLOTH,
    upperback: f ? CLOTH : SKIN,
    delt: SKIN,
    upperarm: SKIN,
    forearm: SKIN,
    thigh: SKIN,
    shin: SKIN,
  };
  const mats = Object.fromEntries(Object.entries(base).map(([k, c]) => [k, mat(c)])) as Record<Part, THREE.MeshStandardMaterial>;
  const skin = mat(SKIN);
  const cloth = mat(CLOTH);
  const hair = mat(HAIR);
  const sk = createSkeleton();

  // panggul & bokong (celana)
  sk.root.add(blob(mats.pelvis, [0, 0.02, 0], [0.165 * w * (f ? 1.1 : 1) + hip * 0.03, 0.11, 0.11 * w + hip * 0.015]));
  sk.root.add(blob(mats.glutes, [0, -0.01, -0.045 - hip * 0.01], [0.15 * w * (f ? 1.08 : 1), 0.1, 0.08 * w]));

  // badan
  const sp = sk.spine;
  sp.add(blob(mats.abs, [0, 0.15, 0.012 + belly * 0.035], [0.145 * w + belly * 0.035, 0.15 + belly * 0.012, 0.1 * Math.sqrt(w) + belly * 0.07]));
  sp.add(blob(mats.lowerback, [0, 0.14, -0.035], [0.13 * w, 0.12, 0.075 * Math.sqrt(w)]));
  sp.add(blob(mats.upperback, [0, 0.35, -0.03], [dims.shX - 0.01, 0.15, 0.09 * Math.sqrt(w)]));
  sp.add(blob(mats.pecs, [0, 0.35, 0.01], [dims.shX - 0.005, 0.16, 0.105 * Math.sqrt(w) + belly * 0.01]));
  if (f) for (const d of [-1, 1]) sp.add(blob(mats.bust, [d * 0.065, 0.34, 0.085 + belly * 0.01], [0.062, 0.057, 0.052]));
  // leher & kepala
  sk.neck.add(limb(skin, 0.08, 0.045 * Math.sqrt(w), 0.03));
  sk.neck.add(blob(skin, [0, 0.16, 0.01], [0.085, 0.105, 0.095]));
  sk.neck.add(blob(hair, [0, 0.21, -0.012], [0.088, 0.07, 0.092]));

  for (const i of [0, 1] as const) {
    // lengan
    sk.sh[i].add(blob(mats.delt, [0, -0.01, 0], [0.06 * Math.sqrt(w), 0.06, 0.06]));
    sk.sh[i].add(limb(mats.upperarm, BONE.upper - 0.04, armR, -BONE.upper / 2));
    sk.el[i].add(limb(mats.forearm, BONE.fore - 0.04, armR * 0.82, -BONE.fore / 2));
    sk.hand[i].add(blob(skin, [0, -0.03, 0], [0.032, 0.05, 0.04]));
    // kaki
    sk.hip[i].add(limb(mats.thigh, BONE.thigh - 0.04, thighR, -BONE.thigh / 2));
    sk.hip[i].add(limb(cloth, 0.12, thighR + 0.012, -0.08));
    sk.knee[i].add(limb(mats.shin, BONE.shin - 0.04, 0.046 * Math.sqrt(w), -BONE.shin / 2));
    sk.foot[i].add(blob(mat("#202020"), [0, -0.035, 0.045], [0.045, 0.03, 0.1]));
    if (ex?.props.includes("dumbel")) {
      const db = dumbbell();
      db.position.set(0, -0.035, 0);
      sk.hand[i].add(db);
    }
  }

  return { sk, dims, mats, base, barbell: ex?.props.includes("barbel") ? barbell() : null };
}

function paint(b: Built, ex: Exercise | null) {
  for (const k of Object.keys(b.mats) as Part[]) b.mats[k].color.set(b.base[k]);
  if (!ex) return;
  for (const m of ex.secondary) for (const p of MUSCLE_PART[m]) b.mats[p].color.set(SECONDARY);
  for (const m of ex.primary) for (const p of MUSCLE_PART[m]) b.mats[p].color.set(PRIMARY);
}

const tmpA = new THREE.Vector3(),
  tmpB = new THREE.Vector3();

function Figure({ shape, exercise, playing, pose }: { shape: BodyShape; exercise: Exercise | null; playing: boolean; pose?: Pose }) {
  const scaleK = shape.heightCm / 172;
  const holder = useRef<THREE.Group>(null);
  // bentuk badan berubah → bangun ulang mesh (murah: ±30 mesh)
  const built = useMemo(
    () => build(shape, exercise),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape.sex, Math.round(shape.bmi * 10), Math.round(shape.bodyFatPct), exercise?.id],
  );
  const clock = useRef(0);

  useEffect(() => {
    paint(built, exercise);
    applyPose(built.sk, pose ?? exercise?.a ?? STAND, built.dims);
  }, [built, exercise, pose]);

  useFrame((_, dt) => {
    if (exercise && playing) {
      clock.current += dt;
      const t = (1 - Math.cos((clock.current / exercise.period) * Math.PI * 2)) / 2;
      applyPose(built.sk, lerpPose(exercise.a, exercise.b, t), built.dims);
    }
    if (built.barbell && holder.current) {
      // barbel selalu di tengah kedua tangan
      built.sk.hand[0].getWorldPosition(tmpA);
      built.sk.hand[1].getWorldPosition(tmpB);
      tmpA.add(tmpB).multiplyScalar(0.5);
      holder.current.worldToLocal(tmpA);
      built.barbell.position.copy(tmpA).add(new THREE.Vector3(0, -0.03, 0));
    }
  });

  return (
    <group ref={holder} scale={[scaleK, scaleK, scaleK]}>
      <primitive object={built.sk.root} />
      {built.barbell && <primitive object={built.barbell} />}
      {exercise?.props.includes("bangku") && (
        <group>
          <mesh position={[0, 0.34, -0.3]} castShadow>
            <boxGeometry args={[0.3, 0.06, 1.15]} />
            <meshStandardMaterial color="#2E2E2E" roughness={0.6} />
          </mesh>
          {[-0.75, 0.15].map((z) => (
            <mesh key={z} position={[0, 0.16, z]}>
              <boxGeometry args={[0.22, 0.32, 0.06]} />
              <meshStandardMaterial color="#8F8F8F" />
            </mesh>
          ))}
        </group>
      )}
      {exercise?.props.includes("palang") && (
        <group>
          <mesh position={[0, 2.22, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 1.3, 12]} />
            <meshStandardMaterial color="#A8A8A8" />
          </mesh>
          {[-0.65, 0.65].map((x) => (
            <mesh key={x} position={[x, 1.12, 0]}>
              <boxGeometry args={[0.05, 2.24, 0.05]} />
              <meshStandardMaterial color="#2E2E2E" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function Mannequin3D({
  shape,
  exercise = null,
  playing = true,
  pose,
  autoRotate,
}: {
  shape: BodyShape;
  exercise?: Exercise | null;
  playing?: boolean;
  pose?: Pose;
  autoRotate?: boolean;
}) {
  const tall = exercise?.props.includes("palang");
  const view = exercise?.view ?? "depan";
  const lying = exercise ? Math.abs(exercise.a.rx) > 45 : false;
  let cam: [number, number, number] = [0.4, 1.05, 3.4];
  let target: [number, number, number] = [0, 0.9, 0];
  if (tall) {
    cam = [view === "belakang" ? -0.8 : 0.6, 1.45, view === "belakang" ? -4.6 : 4.6];
    target = [0, 1.25, 0];
  } else if (view === "samping" && lying) {
    cam = [2.7, 1.15, 1.5];
    target = [0, 0.45, -0.2];
  } else if (view === "samping") {
    cam = [3.5, 1.3, 1.9];
    target = [0, 0.85, -0.05];
  } else if (view === "belakang") {
    cam = [-0.6, 1.1, -3.6];
  }
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: cam, fov: 32 }} gl={{ antialias: true, preserveDrawingBuffer: true }} key={`${tall}-${view}-${lying}`}>
      <color attach="background" args={["#EFECE8"]} />
      <hemisphereLight args={["#ffffff", "#b5b5b0", 1.15]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.5} />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} color="#dfe8ff" />
      <Figure shape={shape} exercise={exercise} playing={playing} pose={pose} />
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={4} blur={2.2} far={1.6} />
      <OrbitControls
        target={target}
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}
