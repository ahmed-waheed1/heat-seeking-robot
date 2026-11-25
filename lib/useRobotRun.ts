"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyze, clampToDomain, gradientPath, START, type Vec } from "./heat";

const STEPS_PER_FRAME = 2;

/** Shared state for the 2D map and the 3D hill: start point, gradient path, animation. */
export function useRobotRun() {
  const [start, setStartRaw] = useState<Vec>(START);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const raf = useRef<number | null>(null);

  const path = useMemo(() => gradientPath(start), [start]);
  const current = path.points[Math.min(progress, path.steps)];
  const stats = useMemo(() => analyze(current), [current]);
  const done = progress >= path.steps && path.steps > 0;

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setRunning(false);
  }, []);

  const setStart = useCallback(
    (p: Vec) => {
      stop();
      setStartRaw(clampToDomain(p));
      setProgress(0);
    },
    [stop],
  );

  const run = useCallback(() => {
    stop();
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(path.steps);
      return;
    }
    setProgress(0);
    setRunning(true);
    let i = 0;
    const tick = () => {
      i = Math.min(i + STEPS_PER_FRAME, path.steps);
      setProgress(i);
      if (i < path.steps) raf.current = requestAnimationFrame(tick);
      else {
        raf.current = null;
        setRunning(false);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, [path.steps, stop]);

  const reset = useCallback(() => setStart(START), [setStart]);

  /** Arrow keys nudge the start point (Shift = bigger step); Enter/Space runs. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const d = e.shiftKey ? 0.25 : 0.05;
      const moves: Record<string, Vec> = {
        ArrowLeft: { x: -d, y: 0 },
        ArrowRight: { x: d, y: 0 },
        ArrowUp: { x: 0, y: d },
        ArrowDown: { x: 0, y: -d },
      };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        setStart({ x: current.x + m.x, y: current.y + m.y });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        run();
      }
    },
    [current, run, setStart],
  );

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  return {
    start,
    setStart,
    path,
    progress,
    current,
    stats,
    running,
    done,
    run,
    reset,
    onKeyDown,
    travelled: path.lengths[Math.min(progress, path.steps)],
  };
}

export type RobotRun = ReturnType<typeof useRobotRun>;
