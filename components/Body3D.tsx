"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { Sex } from "@/lib/nutrition";

export interface BodyShape {
  sex: Sex;
  heightCm: number;
  bmi: number;
  bodyFatPct: number;
}

const SKIN = "#D7A982";
const SHORTS = "#2F3B33";
const UP = new THREE.Vector3(0, 1, 0);

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function Blob({ p, r, color = SKIN }: { p: [number, number, number]; r: [number, number, number]; color?: string }) {
  return (
    <mesh position={p} scale={r} castShadow>
      <sphereGeometry args={[1, 40, 28]} />
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  );
}

function Limb({ a, b, r, color = SKIN }: { a: THREE.Vector3; b: THREE.Vector3; r: number; color?: string }) {
  const { pos, quat, len } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    const pos = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    return { pos, quat, len };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <capsuleGeometry args={[r, Math.max(0.001, len), 12, 40]} />
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  );
}

const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);

function Mannequin({ shape }: { shape: BodyShape }) {
  const f = shape.sex === "wanita";
  const w = clamp(Math.sqrt(shape.bmi / 22), 0.82, 1.55); // lebar umum
  const lean = f ? 24 : 15;
  const belly = clamp((shape.bodyFatPct - lean) / 14, 0, 1.6); // lemak perut
  const hip = f ? clamp((shape.bodyFatPct - 20) / 25, 0, 1.2) : belly * 0.4;
  const s = shape.heightCm / 172;

  const sh = 0.19 * Math.sqrt(w) * (f ? 0.88 : 1); // setengah lebar bahu
  const hipX = 0.085 * w * (f ? 1.12 : 1) + hip * 0.02;
  const thighR = 0.068 * w * (f ? 1.06 : 1) + hip * 0.012;
  const armR = 0.04 * Math.pow(w, 0.8);

  return (
    <group scale={[s, s, s]}>
      {/* kaki */}
      {[-1, 1].map((d) => (
        <group key={d}>
          <Limb a={v(d * hipX, 0.9)} b={v(d * 0.09, 0.5)} r={thighR} />
          <Limb a={v(d * 0.09, 0.5)} b={v(d * 0.095, 0.1)} r={0.046 * Math.sqrt(w)} />
          <Blob p={[d * 0.095, 0.035, 0.04]} r={[0.045, 0.03, 0.1]} color="#2B2A26" />
          {/* lengan */}
          <Blob p={[d * sh, 1.42, 0]} r={[0.06 * Math.sqrt(w), 0.055, 0.06]} />
          <Limb a={v(d * sh, 1.4)} b={v(d * (sh + 0.05 + belly * 0.03), 1.13, 0.01)} r={armR} />
          <Limb a={v(d * (sh + 0.05 + belly * 0.03), 1.13, 0.01)} b={v(d * (sh + 0.07 + belly * 0.04), 0.88, 0.05)} r={armR * 0.82} />
          <Blob p={[d * (sh + 0.075 + belly * 0.04), 0.83, 0.06]} r={[0.03, 0.055, 0.042]} />
        </group>
      ))}

      {/* panggul (celana) */}
      <Blob p={[0, 0.94, 0]} r={[0.165 * w * (f ? 1.1 : 1) + hip * 0.03, 0.11, 0.11 * w + hip * 0.015]} color={SHORTS} />
      {[-1, 1].map((d) => (
        <Limb key={d} a={v(d * hipX, 0.93)} b={v(d * 0.088, 0.72)} r={thighR + 0.014} color={SHORTS} />
      ))}

      {/* perut */}
      <Blob
        p={[0, 1.11, 0.012 + belly * 0.035]}
        r={[0.145 * w + belly * 0.035, 0.15 + belly * 0.012, 0.1 * Math.sqrt(w) + belly * 0.07]}
      />
      {/* dada */}
      <Blob p={[0, 1.31, 0]} r={[sh - 0.005, 0.16, 0.11 * Math.sqrt(w) + belly * 0.01]} />
      {f && [-1, 1].map((d) => <Blob key={d} p={[d * 0.065, 1.3, 0.085 + belly * 0.01]} r={[0.06, 0.055, 0.05]} />)}

      {/* leher & kepala */}
      <Limb a={v(0, 1.44)} b={v(0, 1.54)} r={0.045 * Math.sqrt(w)} />
      <Blob p={[0, 1.64, 0.01]} r={[0.085, 0.105, 0.095]} />
      <Blob p={[0, 1.69, -0.012]} r={[0.088, 0.07, 0.092]} color="#2B2A26" />
    </group>
  );
}

export default function Body3D({ shape }: { shape: BodyShape }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.05, 3.3], fov: 30 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#EAE3D5"]} />
      <hemisphereLight args={["#fff8ee", "#b9ad98", 1.1]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#cfe0ff" />
      <Mannequin shape={shape} />
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={3} blur={2.2} far={1.5} />
      <OrbitControls
        target={[0, 0.9, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}
