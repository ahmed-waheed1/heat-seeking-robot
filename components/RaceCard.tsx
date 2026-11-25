"use client";

import { useEffect, useRef, useState } from "react";
import { DOMAIN, END_T, type RobotRun, type Vec } from "@/lib/heat";
import { useRace, type RaceState } from "@/lib/useRace";
import { Lanes, RaceChart, RaceControls, Verdict } from "./RacePanel";

const W_M = DOMAIN.xMax - DOMAIN.xMin;
const H_M = DOMAIN.yMax - DOMAIN.yMin;

const CORAL = "#C9472E";
const SLATE = "#5B6B7A";
// Bands from off-white (cool) to warm coral (hot), one per 10 °C
const LOW = [250, 246, 240];
const HIGH = [242, 176, 152];
const band = (k: number) => {
  const t = k / 9;
  return `rgb(${LOW.map((c, i) => Math.round(c + (HIGH[i] - c) * t)).join(",")})`;
};

function RaceMap({ race }: { race: RaceState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      setSize({ w, h: Math.round((w * H_M) / W_M), dpr: Math.min(window.devicePixelRatio || 1, 2) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    canvas.width = Math.round(size.w * size.dpr);
    canvas.height = Math.round(size.h * size.dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    const k = size.w / W_M; // px per metre (same in x and y)
    const px = (p: Vec) => ({ x: (p.x - DOMAIN.xMin) * k, y: (DOMAIN.yMax - p.y) * k });
    const o = px({ x: 0, y: 0 });
    const s = Math.max(0.75, size.w / 560);

    // Level sets x² + 2y² = −10·ln(L/100) are ellipses: fill from the outside in, then outline.
    ctx.fillStyle = band(0);
    ctx.fillRect(0, 0, size.w, size.h);
    for (let L = 10; L <= 90; L += 10) {
      const r = Math.sqrt(-10 * Math.log(L / 100));
      ctx.beginPath();
      ctx.ellipse(o.x, o.y, r * k, (r / Math.SQRT2) * k, 0, 0, Math.PI * 2);
      ctx.fillStyle = band(L / 10);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(38,50,61,0.28)";
      ctx.stroke();
    }

    // Light axes + tick labels
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono") || "monospace";
    ctx.strokeStyle = "rgba(38,50,61,0.18)";
    ctx.beginPath();
    ctx.moveTo(0, o.y);
    ctx.lineTo(size.w, o.y);
    ctx.moveTo(o.x, 0);
    ctx.lineTo(o.x, size.h);
    ctx.stroke();
    ctx.font = `${Math.round(11 * s)}px ${mono}`;
    ctx.fillStyle = "rgba(38,50,61,0.6)";
    for (let x = DOMAIN.xMin + 1; x < DOMAIN.xMax; x++) if (x) ctx.fillText(String(x), px({ x, y: 0 }).x + 3, o.y + 13 * s);
    for (let y = DOMAIN.yMin + 1; y < DOMAIN.yMax; y++) if (y) ctx.fillText(String(y), o.x + 4, px({ x: 0, y }).y - 3);

    const trail = (run: RobotRun, upto: number, color: string, dash: number[]) => {
      if (upto < 1) return;
      ctx.beginPath();
      run.points.slice(0, upto + 1).forEach((p, i) => {
        const q = px(p);
        if (i) ctx.lineTo(q.x, q.y);
        else ctx.moveTo(q.x, q.y);
      });
      ctx.setLineDash(dash.map((d) => d * s));
      ctx.lineWidth = 3 * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.setLineDash([]);
    };
    trail(race.race.straight, race.straight.i, SLATE, [7, 6]);
    trail(race.race.gradient, race.gradient.i, CORAL, []);

    // Source star
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 ? 5.5 : 13) * s;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(o.x + rad * Math.cos(a), o.y + rad * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = CORAL;
    ctx.fill();
    ctx.lineWidth = 2 * s;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    // Start marker
    const st = px(race.start);
    ctx.beginPath();
    ctx.arc(st.x, st.y, 4 * s, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(38,50,61,0.55)";
    ctx.fill();

    const robot = (p: Vec, color: string) => {
      const q = px(p);
      ctx.beginPath();
      ctx.arc(q.x, q.y, 8 * s, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2.5 * s;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    };
    robot(race.straight.p, SLATE);
    robot(race.gradient.p, CORAL);
  }, [race, size]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    race.setStart({
      x: DOMAIN.xMin + ((e.clientX - rect.left) / rect.width) * W_M,
      y: DOMAIN.yMax - ((e.clientY - rect.top) / rect.height) * H_M,
    });
  };

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-2xl border border-line">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label={`Temperature map, x from −1 to 4 m and y from −1 to 3 m, bands every 10 °C, heat source star at the origin. Click or tap to choose a new start. Arrow keys move the start, Shift plus arrow moves faster, Enter starts or pauses the race.`}
        onPointerDown={onPointerDown}
        onKeyDown={race.onKeyDown}
        className="block w-full cursor-crosshair touch-none"
        style={{ aspectRatio: `${W_M} / ${H_M}` }}
      />
    </div>
  );
}

export function RaceCard() {
  const race = useRace();
  return (
    <section aria-labelledby="race-title" className="rounded-[20px] border border-line bg-paper p-4 shadow-[0_1px_2px_rgba(38,50,61,0.04),0_12px_40px_-20px_rgba(38,50,61,0.18)] sm:p-6 lg:p-8">
      <h2 id="race-title" className="mb-5 font-mono text-sm font-medium uppercase tracking-[0.18em] text-coral">
        The race
      </h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
        <div>
          <RaceMap race={race} />
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-[3px] w-6 rounded bg-coral" /> Gradient robot
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block w-6 border-t-[3px] border-dashed border-slate" /> Straight robot
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="text-coral">★</span> Heat source
            </li>
            <li>Tap the map to move the start</li>
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <Lanes race={race} />
          <RaceChart race={race} />
          <Verdict race={race} />
          <RaceControls race={race} />
        </div>
      </div>
      <p className="mt-6 max-w-3xl text-sm text-muted">
        After the finish line the race keeps going to {END_T} °C: near the fire the straight robot catches up. ∇T
        gives the steepest direction at each point, not the shortest route to a temperature.
      </p>
    </section>
  );
}
