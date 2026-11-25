"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DOMAIN, temperature, type Vec } from "@/lib/heat";
import type { RobotRun } from "@/lib/useRobotRun";

export type View = "top" | "angled" | "side";

const Z_SCALE = 1 / 25; // z = T/25
const CX = (DOMAIN.xMin + DOMAIN.xMax) / 2;
const CY = (DOMAIN.yMin + DOMAIN.yMax) / 2;

/** Math (x, y, height) → three.js world, with y up and the domain centred. */
const toWorld = (p: Vec, lift = 0): [number, number, number] => [
  p.x - CX,
  temperature(p.x, p.y) * Z_SCALE + lift,
  -(p.y - CY),
];

const VIEWS: Record<View, [number, number, number]> = {
  top: [0, 9.5, 0.01],
  angled: [5.5, 6, 7],
  side: [0, 2.2, 9.5],
};
const TARGET = new THREE.Vector3(0, 1.2, 0);

function useSurface() {
  return useMemo(() => {
    const nx = 120;
    const ny = 96;
    const positions = new Float32Array((nx + 1) * (ny + 1) * 3);
    const colors = new Float32Array((nx + 1) * (ny + 1) * 3);
    const light = new THREE.Color("#EEF3E8");
    const dark = new THREE.Color("#1F4D3A");
    const c = new THREE.Color();
    let k = 0;
    for (let j = 0; j <= ny; j++) {
      const y = DOMAIN.yMin + (j / ny) * (DOMAIN.yMax - DOMAIN.yMin);
      for (let i = 0; i <= nx; i++) {
        const x = DOMAIN.xMin + (i / nx) * (DOMAIN.xMax - DOMAIN.xMin);
        const t = temperature(x, y);
        const [wx, wy, wz] = toWorld({ x, y });
        positions.set([wx, wy, wz], k * 3);
        c.copy(light).lerp(dark, Math.pow(t / 100, 0.8));
        colors.set([c.r, c.g, c.b], k * 3);
        k++;
      }
    }
    const indices: number[] = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i;
        const b = a + 1;
        const d = a + (nx + 1);
        const e = d + 1;
        indices.push(a, d, b, b, d, e);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/** Level sets x² + 2y² = −10·ln(L/100) are ellipses; clip them to the domain. */
function useContours() {
  return useMemo(() => {
    const segs: { level: number; pts: [number, number, number][] }[] = [];
    for (let L = 10; L <= 90; L += 10) {
      const r = Math.sqrt(-10 * Math.log(L / 100));
      let cur: [number, number, number][] = [];
      for (let s = 0; s <= 360; s++) {
        const a = (s / 360) * Math.PI * 2;
        const x = r * Math.cos(a);
        const y = (r * Math.sin(a)) / Math.SQRT2;
        const inside = x >= DOMAIN.xMin && x <= DOMAIN.xMax && y >= DOMAIN.yMin && y <= DOMAIN.yMax;
        if (inside) cur.push([x - CX, L * Z_SCALE + 0.012, -(y - CY)]);
        else if (cur.length) {
          if (cur.length > 1) segs.push({ level: L, pts: cur });
          cur = [];
        }
      }
      if (cur.length > 1) segs.push({ level: L, pts: cur });
    }
    return segs;
  }, []);
}

function CameraRig({ view }: { view: View }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const goal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    goal.current = new THREE.Vector3(...VIEWS[view]);
  }, [view]);

  useFrame((_, dt) => {
    if (!goal.current) return;
    camera.position.lerp(goal.current, 1 - Math.exp(-dt * 6));
    controls?.target.lerp(TARGET, 1 - Math.exp(-dt * 6));
    controls?.update();
    if (camera.position.distanceTo(goal.current) < 0.01) goal.current = null;
  });

  // Stop the glide if the user grabs the camera
  useEffect(() => {
    if (!controls) return;
    const stop = () => (goal.current = null);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  return null;
}

function Scene({ run, view }: { run: RobotRun; view: View }) {
  const surface = useSurface();
  const contours = useContours();
  const { path, progress, start, current } = run;
  const shown = Math.min(progress, path.steps);

  const trail = useMemo(
    () => path.points.slice(0, shown + 1).map((p) => toWorld(p, 0.03)),
    [path, shown],
  );
  const straight = useMemo(() => {
    const n = 80;
    return Array.from({ length: n + 1 }, (_, i) =>
      toWorld({ x: start.x * (1 - i / n), y: start.y * (1 - i / n) }, 0.03),
    );
  }, [start]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // was an orbit drag, not a tap
    e.stopPropagation();
    run.setStart({ x: e.point.x + CX, y: -e.point.z + CY });
  };

  const peak = toWorld({ x: 0, y: 0 });

  return (
    <>
      <color attach="background" args={["#F3F6EE"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 8, 5]} intensity={1.6} />
      <directionalLight position={[-5, 3, -4]} intensity={0.4} />

      <mesh
        geometry={surface}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = "crosshair")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} metalness={0} />
      </mesh>

      {contours.map((c, i) => (
        <Line key={i} points={c.pts} color={c.level >= 60 ? "#E4EDDF" : "#1A2E24"} lineWidth={1.2} transparent opacity={0.7} />
      ))}

      <Line points={straight} color="#6b716d" lineWidth={2.5} dashed dashSize={0.12} gapSize={0.08} />
      {trail.length > 1 && <Line points={trail} color="#C2530F" lineWidth={4} />}

      {/* Peak marker (heat source) */}
      <mesh position={[peak[0], peak[1] + 0.32, peak[2]]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 5]} />
        <meshStandardMaterial color="#C2530F" emissive="#C2530F" emissiveIntensity={0.25} />
      </mesh>

      {/* Robot */}
      <mesh position={toWorld(current, 0.09)}>
        <sphereGeometry args={[0.09, 32, 32]} />
        <meshStandardMaterial color="#C2530F" emissive="#7a2f05" emissiveIntensity={0.35} roughness={0.4} />
      </mesh>

      <OrbitControls makeDefault target={TARGET} minDistance={3} maxDistance={18} maxPolarAngle={Math.PI / 2 - 0.02} />
      <CameraRig view={view} />
    </>
  );
}

export default function HillScene({ run, view }: { run: RobotRun; view: View }) {
  return (
    <Canvas camera={{ position: VIEWS.angled, fov: 40 }} dpr={[1, 2]}>
      <Scene run={run} view={view} />
    </Canvas>
  );
}
