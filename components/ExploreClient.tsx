"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useRace } from "@/lib/useRace";
import type { View } from "./HillScene";
import { Lanes, RaceChart, RaceControls, Verdict } from "./RacePanel";

const HillScene = dynamic(() => import("./HillScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-muted" role="status">
      Loading the 3D hill…
    </div>
  ),
});

const VIEW_LABELS: [View, string][] = [
  ["top", "Top"],
  ["angled", "Angled"],
  ["side", "Side"],
];

export function ExploreClient() {
  const race = useRace();
  const [view, setView] = useState<View>("angled");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <Link href="/" className="rounded-full px-3 py-1 font-semibold hover:bg-sand">
          ← Back
        </Link>
        <p className="font-mono text-xs text-muted sm:text-sm">z = T(x, y) / 25 · x ∈ [−1, 4], y ∈ [−1, 3]</p>
      </header>

      <main id="main" className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div
          tabIndex={0}
          role="application"
          aria-label="3D temperature hill with both robots. Drag to orbit, scroll or pinch to zoom, tap the hill to choose a new start. Arrow keys move the start, Enter starts or pauses the race."
          onKeyDown={race.onKeyDown}
          className="relative h-[60vh] min-h-[340px] lg:h-auto"
        >
          <HillScene race={race} view={view} />
        </div>

        <aside
          aria-labelledby="explore-title"
          className="flex flex-col gap-5 border-t border-line bg-paper p-5 sm:p-6 lg:border-l lg:border-t-0"
        >
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-[0.18em] text-coral">The race in 3D</p>
            <h1 id="explore-title" className="mt-1 font-serif text-3xl font-bold leading-tight">
              Two Robots, One Fire
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Height is temperature. The coral robot follows ∇T; the slate robot aims straight at the source. Tap
              the hill to move the start.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">View</legend>
            <div className="flex gap-2">
              {VIEW_LABELS.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className="flex-1 rounded-full border border-line px-3 py-2 text-sm font-semibold transition hover:bg-sand aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <Lanes race={race} />
          <RaceChart race={race} />
          <Verdict race={race} />
          <RaceControls race={race} />
        </aside>
      </main>
    </div>
  );
}
