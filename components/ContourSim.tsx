"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOMAIN, SOURCE, temperature, type Vec } from "@/lib/heat";
import { useRobotRun } from "@/lib/useRobotRun";
import { Readouts } from "./Readouts";
import { RunControls } from "./RunControls";

const W_M = DOMAIN.xMax - DOMAIN.xMin;
const H_M = DOMAIN.yMax - DOMAIN.yMin;

// Band colours: light (cool) to deep green (hot), one band per 10 °C
const LIGHT = [236, 242, 230];
const DARK = [31, 77, 58];
const LINE = [15, 34, 25];
const bandColor = (band: number) => {
  const t = Math.min(band, 9) / 9;
  return LIGHT.map((c, i) => Math.round(c + (DARK[i] - c) * t));
};

function renderField(w: number, h: number): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const bands = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    const y = DOMAIN.yMax - ((j + 0.5) / h) * H_M;
    for (let i = 0; i < w; i++) {
      const x = DOMAIN.xMin + ((i + 0.5) / w) * W_M;
      bands[j * w + i] = Math.min(9, Math.floor(temperature(x, y) / 10));
    }
  }
  const lineW = Math.max(1, Math.round(w / 500));
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      const b = bands[k];
      let edge = false;
      for (let d = 1; d <= lineW && !edge; d++) {
        if (i + d < w && bands[k + d] !== b) edge = true;
        if (j + d < h && bands[k + d * w] !== b) edge = true;
      }
      // Contour lines: the band colour pulled 60% toward near-black green
      const [r, g, bl] = bandColor(b).map((c, n) => (edge ? Math.round(c * 0.4 + LINE[n] * 0.6) : c));
      const o = k * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = bl;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return off;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = "#C2530F";
  ctx.fill();
  ctx.lineWidth = r * 0.18;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

export function ContourSim() {
  const run = useRobotRun();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLCanvasElement | null>(null);
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
    if (!size.w) return;
    fieldRef.current = renderField(Math.round(size.w * size.dpr), Math.round(size.h * size.dpr));
  }, [size]);

  const toPx = useCallback(
    (p: Vec) => ({ x: ((p.x - DOMAIN.xMin) / W_M) * size.w, y: ((DOMAIN.yMax - p.y) / H_M) * size.h }),
    [size],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field || !size.w) return;
    canvas.width = field.width;
    canvas.height = field.height;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    ctx.drawImage(field, 0, 0, size.w, size.h);

    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-dm-mono") || "monospace";
    const s = size.w / 600; // scale factor for strokes and labels

    // Axes through the origin + integer tick labels
    ctx.strokeStyle = "rgba(26,46,36,0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const o = toPx(SOURCE);
    ctx.beginPath();
    ctx.moveTo(0, o.y);
    ctx.lineTo(size.w, o.y);
    ctx.moveTo(o.x, 0);
    ctx.lineTo(o.x, size.h);
    ctx.stroke();
    ctx.font = `${Math.max(10, 11 * s)}px ${mono}`;
    ctx.fillStyle = "rgba(26,46,36,0.75)";
    for (let x = DOMAIN.xMin + 1; x < DOMAIN.xMax; x++) {
      if (x === 0) continue;
      const p = toPx({ x, y: 0 });
      ctx.fillText(String(x), p.x + 3, p.y + 13 * Math.max(1, s));
    }
    for (let y = DOMAIN.yMin + 1; y < DOMAIN.yMax; y++) {
      if (y === 0) continue;
      const p = toPx({ x: 0, y });
      ctx.fillText(String(y), p.x + 4, p.y - 3);
    }

    const { path, progress, start, current, stats } = run;
    const sp = toPx(start);

    // Straight line to the source (comparison)
    ctx.setLineDash([7 * s, 6 * s]);
    ctx.strokeStyle = "rgba(90,96,92,0.9)";
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(o.x, o.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gradient path so far
    const shown = Math.min(progress, path.steps);
    if (shown > 0) {
      ctx.strokeStyle = "#C2530F";
      ctx.lineWidth = 3.5 * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      path.points.slice(0, shown + 1).forEach((p, i) => {
        const q = toPx(p);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
    }

    drawStar(ctx, o.x, o.y, 13 * Math.max(0.8, s));

    // ∇T direction arrow at the robot
    const c = toPx(current);
    if (stats.maxRate > 1e-6 && !run.done) {
      const len = 46 * s;
      const ux = stats.grad.x / stats.maxRate;
      const uy = -stats.grad.y / stats.maxRate;
      const ex = c.x + ux * len;
      const ey = c.y + uy * len;
      ctx.strokeStyle = "#1A2E24";
      ctx.fillStyle = "#1A2E24";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const a = Math.atan2(uy, ux);
      const hl = 9 * s;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - hl * Math.cos(a - 0.45), ey - hl * Math.sin(a - 0.45));
      ctx.lineTo(ex - hl * Math.cos(a + 0.45), ey - hl * Math.sin(a + 0.45));
      ctx.closePath();
      ctx.fill();
    }

    // Robot
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9 * Math.max(0.8, s), 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 3.5 * Math.max(0.8, s);
    ctx.strokeStyle = "#C2530F";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3.5 * Math.max(0.8, s), 0, Math.PI * 2);
    ctx.fillStyle = "#1A2E24";
    ctx.fill();
  }, [run, size, toPx]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = DOMAIN.xMin + ((e.clientX - rect.left) / rect.width) * W_M;
    const y = DOMAIN.yMax - ((e.clientY - rect.top) / rect.height) * H_M;
    run.setStart({ x, y });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div ref={wrapRef} className="overflow-hidden rounded-[12px] border border-forest/20 shadow-sm">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="application"
            aria-label="Temperature contour map from x = −1 to 4 and y = −1 to 3 metres. The star marks the heat source at the origin. Click or tap to place the robot. Arrow keys move the robot, Shift plus arrow moves faster, Enter runs the gradient path."
            aria-describedby="sim-readouts"
            onPointerDown={onPointerDown}
            onKeyDown={run.onKeyDown}
            className="block w-full touch-none cursor-crosshair"
            style={{ aspectRatio: `${W_M} / ${H_M}` }}
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-1 w-6 rounded bg-ember" /> Gradient path
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block w-6 border-t-2 border-dashed border-[#5a605c]" /> Straight at source
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-ember">★</span> Heat source (0, 0)
          </li>
          <li>Bands every 10 °C</li>
        </ul>
      </div>
      <div className="flex flex-col gap-4" id="sim-readouts">
        <RunControls run={run} />
        <Readouts run={run} />
        <p className="text-sm text-muted">
          Tip: tap anywhere on the map to drop the robot there. With the map focused, use the arrow keys to nudge
          it and Enter to run.
        </p>
      </div>
    </div>
  );
}
