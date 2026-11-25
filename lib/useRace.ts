"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampToDomain, robotAt, simulateRace, START, verdict, type Vec } from "./heat";

const STEPS_PER_FRAME = 2;

export type RaceStatus = "idle" | "running" | "paused" | "done";

/** Shared race state for the 2D map and the 3D hill. */
export function useRace() {
  const [start, setStartRaw] = useState<Vec>(START);
  const race = useMemo(() => simulateRace(start), [start]);
  const [frame, setFrame] = useState(0);
  const [status, setStatus] = useState<RaceStatus>("idle");
  const raf = useRef<number | null>(null);
  const frameRef = useRef(0);

  const cancel = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const loop = useCallback(() => {
    const tick = () => {
      frameRef.current = Math.min(frameRef.current + STEPS_PER_FRAME, race.total);
      setFrame(frameRef.current);
      if (frameRef.current < race.total) raf.current = requestAnimationFrame(tick);
      else {
        raf.current = null;
        setStatus("done");
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, [race.total]);

  const startRace = useCallback(() => {
    cancel();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || race.total === 0) {
      frameRef.current = race.total;
      setFrame(race.total);
      setStatus("done");
      return;
    }
    frameRef.current = 0;
    setFrame(0);
    setStatus("running");
    loop();
  }, [cancel, loop, race.total]);

  const pause = useCallback(() => {
    cancel();
    setStatus("paused");
  }, [cancel]);

  const resume = useCallback(() => {
    setStatus("running");
    loop();
  }, [loop]);

  const setStart = useCallback(
    (p: Vec) => {
      cancel();
      setStartRaw(clampToDomain(p));
      frameRef.current = 0;
      setFrame(0);
      setStatus("idle");
    },
    [cancel],
  );

  const reset = useCallback(() => setStart(START), [setStart]);

  /** Arrow keys nudge the start (Shift = bigger step); Enter/Space starts or pauses. */
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
        setStart({ x: start.x + m.x, y: start.y + m.y });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (status === "running") pause();
        else if (status === "paused") resume();
        else startRace();
      }
    },
    [pause, resume, setStart, start, startRace, status],
  );

  useEffect(() => cancel, [cancel]);

  return {
    start,
    race,
    frame,
    status,
    gradient: robotAt(race.gradient, frame),
    straight: robotAt(race.straight, frame),
    verdict: verdict(race, frame),
    startRace,
    pause,
    resume,
    reset,
    setStart,
    onKeyDown,
  };
}

export type RaceState = ReturnType<typeof useRace>;
