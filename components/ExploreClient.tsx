"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useRobotRun } from "@/lib/useRobotRun";
import type { View } from "./HillScene";
import { Readouts } from "./Readouts";
import { RunControls } from "./RunControls";

const HillScene = dynamic(() => import("./HillScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-muted" role="status">
      Loading 3D hill…
    </div>
  ),
});

const VIEW_LABELS: [View, string][] = [
  ["top", "Top"],
  ["angled", "Angled"],
  ["side", "Side"],
];

export function ExploreClient() {
  const run = useRobotRun();
  const [view, setView] = useState<View>("angled");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/15 px-4 py-3 sm:px-6">
        <Link href="/" className="rounded-lg px-2 py-1 font-semibold text-forest hover:bg-card">
          ← Back to project
        </Link>
        <p className="font-mono text-xs text-muted sm:text-sm">z = T(x, y) / 25 · x ∈ [−1, 4], y ∈ [−1, 3]</p>
      </header>

      <main id="main" className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div
          tabIndex={0}
          role="application"
          aria-label="3D temperature hill. Drag to orbit, scroll or pinch to zoom, tap the ground to move the robot. Arrow keys move the robot, Enter runs."
          aria-describedby="hill-readouts"
          onKeyDown={run.onKeyDown}
          className="relative h-[62vh] min-h-[340px] lg:h-auto"
        >
          <HillScene run={run} view={view} />
        </div>

        <aside
          aria-labelledby="explore-title"
          className="flex flex-col gap-5 border-t border-forest/15 bg-white/50 p-5 lg:border-l lg:border-t-0"
        >
          <div>
            <h1 id="explore-title" className="font-serif text-3xl text-forest">
              The temperature hill
            </h1>
            <p className="mt-2 text-sm text-muted">
              Height is temperature. The orange robot climbs along ∇T; the grey dashed line is the straight route to
              the peak. Tap the ground to move the start.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">View</legend>
            <div className="flex gap-2" role="group">
              {VIEW_LABELS.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className="flex-1 rounded-[12px] border border-forest/25 px-3 py-2 text-sm font-semibold text-forest transition hover:bg-card aria-pressed:border-forest aria-pressed:bg-forest aria-pressed:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <RunControls run={run} />
          <div id="hill-readouts">
            <Readouts run={run} compact />
          </div>

          <ul className="space-y-1.5 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 rounded-full bg-ember" /> Robot and gradient trail
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block w-6 border-t-2 border-dashed border-[#6b716d]" /> Straight at
              the peak
            </li>
            <li>Rings every 10 °C</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
