"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DOMAIN, temperature, type RobotRun, type Vec } from "@/lib/heat";
import type { RaceState } from "@/lib/useRace";

export type View = "top" | "angled" | "side";

const Z_SCALE = 1 / 25; // z = T/25
const CX = (DOMAIN.xMin + DOMAIN.xMax) / 2;
const CY = (DOMAIN.yMin + DOMAIN.yMax) / 2;
const CORAL = "#C9472E";
const SLATE = "#5B6B7A";

/** Math (x, y, height) → three.js world: y is up and the domain is centred. */
const toWorld = (p: Vec, lift = 0): [number, number, number] => [
  p.x - CX,
  temperature(p.x, p.y) * Z_SCALE + lift,
  -(p.y - CY),
];

const TARGET = new THREE.Vector3(-0.4, 1.4, 0.3);
const VIEWS: Record<View, [number, number, number]> = {
  top: [-0.4, 10, 0.31],
  angled: [5, 5.5, 7],
  side: [-0.4, 2, 9.5],
};

function useSurface() {
  return useMemo(() => {
    const nx = 120;
    const ny = 96;
    const positions = new Float32Array((nx + 1) * (ny + 1) * 3);
    const colors = new Float32Array((nx + 1) * (ny + 1) * 3);
    const low = new THREE.Color("#F7F2EA");
    const high = new THREE.Color(CORAL);
    const c = new THREE.Color();
    let k = 0;
    for (let j = 0; j <= ny; j++) {
      const y = DOMAIN.yMin + (j / ny) * (DOMAIN.yMax - DOMAIN.yMin);
      for (let i = 0; i <= nx; i++) {
        const x = DOMAIN.xMin + (i / nx) * (DOMAIN.xMax - DOMAIN.xMin);
        positions.set(toWorld({ x, y }), k * 3);
        c.copy(low).lerp(high, Math.pow(temperature(x, y) / 100, 1.1) * 0.85);
        colors.set([c.r, c.g, c.b], k * 3);
        k++;
      }
    }
    const indices: number[] = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i;
        const d = a + nx + 1;
        indices.push(a, d, a + 1, a + 1, d, d + 1);
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

/** Level sets x² + 2y² = −10·ln(L/100) are ellipses, clipped to the domain. */
function useContours() {
  return useMemo(() => {
    const segs: [number, number, number][][] = [];
    for (let L = 10; L <= 90; L += 10) {
      const r = Math.sqrt(-10 * Math.log(L / 100));
      let cur: [number, number, number][] = [];
      for (let s = 0; s <= 360; s++) {
        const a = (s / 360) * Math.PI * 2;
        const x = r * Math.cos(a);
        const y = (r * Math.sin(a)) / Math.SQRT2;
        if (x >= DOMAIN.xMin && x <= DOMAIN.xMax && y >= DOMAIN.yMin && y <= DOMAIN.yMax) {
          cur.push([x - CX, L * Z_SCALE + 0.01, -(y - CY)]);
        } else if (cur.length) {
          if (cur.length > 1) segs.push(cur);
          cur = [];
        }
      }
      if (cur.length > 1) segs.push(cur);
    }
    return segs;
  }, []);
}

function CameraRig({ view }: { view: View }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const goal = useRef<THREE.Vector3 | null>(null);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    goal.current = new THREE.Vector3(...VIEWS[view]);
  }, [view]);

  useFrame((_, dt) => {
    if (!goal.current) return;
    const t = reduce.current ? 1 : 1 - Math.exp(-dt * 6);
    camera.position.lerp(goal.current, t);
    controls?.target.lerp(TARGET, t);
    controls?.update();
    if (camera.position.distanceTo(goal.current) < 0.01) goal.current = null;
  });

  // Stop the glide when the user grabs the camera
  useEffect(() => {
    if (!controls) return;
    const stop = () => (goal.current = null);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  return null;
}

function Trail({ run, upto, color, dashed }: { run: RobotRun; upto: number; color: string; dashed?: boolean }) {
  const pts = useMemo(() => run.points.slice(0, upto + 1).map((p) => toWorld(p, 0.03)), [run, upto]);
  if (pts.length < 2) return null;
  return dashed ? (
    <Line points={pts} color={color} lineWidth={3} dashed dashSize={0.1} gapSize={0.07} />
  ) : (
    <Line points={pts} color={color} lineWidth={3.5} />
  );
}

function Robot({ p, color }: { p: Vec; color: string }) {
  return (
    <mesh position={toWorld(p, 0.09)}>
      <sphereGeometry args={[0.09, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  );
}

function Scene({ race, view }: { race: RaceState; view: View }) {
  const surface = useSurface();
  const contours = useContours();
  const peak = toWorld({ x: 0, y: 0 });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // an orbit drag, not a tap
    e.stopPropagation();
    race.setStart({ x: e.point.x + CX, y: -e.point.z + CY });
  };

  return (
    <>
      <color attach="background" args={["#FAF8F5"]} />
      <hemisphereLight args={["#ffffff", "#e9dfd3", 1.4]} />
      <directionalLight position={[4, 9, 6]} intensity={1.3} />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} />

      <mesh
        geometry={surface}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = "crosshair")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.95} metalness={0} />
      </mesh>

      {contours.map((pts, i) => (
        <Line key={i} points={pts} color="#26323D" lineWidth={1} transparent opacity={0.3} />
      ))}

      <Trail run={race.race.straight} upto={race.straight.i} color={SLATE} dashed />
      <Trail run={race.race.gradient} upto={race.gradient.i} color={CORAL} />

      {/* Heat source marker */}
      <mesh position={[peak[0], peak[1] + 0.32, peak[2]]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.09, 0.36, 5]} />
        <meshStandardMaterial color={CORAL} emissive={CORAL} emissiveIntensity={0.2} />
      </mesh>

      <Robot p={race.straight.p} color={SLATE} />
      <Robot p={race.gradient.p} color={CORAL} />

      <OrbitControls makeDefault target={TARGET} minDistance={3} maxDistance={18} maxPolarAngle={Math.PI / 2 - 0.02} />
      <CameraRig view={view} />
    </>
  );
}

export default function HillScene({ race, view }: { race: RaceState; view: View }) {
  return (
    <Canvas camera={{ position: VIEWS.angled, fov: 40 }} dpr={[1, 2]}>
      <Scene race={race} view={view} />
    </Canvas>
  );
}
