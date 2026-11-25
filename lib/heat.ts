// Temperature model and the two-robot race.
// Heat source at the origin: T(x, y) = 100·e^(−(x² + 2y²)/10) °C

export type Vec = { x: number; y: number };

export const START: Vec = { x: 3, y: 2 };
export const DOMAIN = { xMin: -1, xMax: 4, yMin: -1, yMax: 3 } as const;

export const STEP = 0.03; // metres per step, same for both robots
export const FINISH_T = 70; // the race is decided here
export const END_T = 95; // the animation keeps going until both reach this
const MAX_STEPS = 2000;

export function temperature(x: number, y: number): number {
  return 100 * Math.exp(-(x * x + 2 * y * y) / 10);
}

/** ∇T = T·(−x/5, −2y/5) */
export function gradient(x: number, y: number): Vec {
  const t = temperature(x, y);
  return { x: t * (-x / 5), y: t * ((-2 * y) / 5) };
}

export function clampToDomain(p: Vec): Vec {
  return {
    x: Math.min(DOMAIN.xMax, Math.max(DOMAIN.xMin, p.x)),
    y: Math.min(DOMAIN.yMax, Math.max(DOMAIN.yMin, p.y)),
  };
}

/** Gradient robot's rate: |∇T| (the fastest possible rise). */
export function gradientRate(p: Vec): number {
  const g = gradient(p.x, p.y);
  return Math.hypot(g.x, g.y);
}

/** Straight robot's rate: D_u T with u = −p/|p|, i.e. −(∇T·p)/|p|. Null at the source. */
export function straightRate(p: Vec): number | null {
  const r = Math.hypot(p.x, p.y);
  if (r < 1e-9) return null;
  const g = gradient(p.x, p.y);
  return -(g.x * p.x + g.y * p.y) / r;
}

export type RobotKind = "gradient" | "straight";

export type RobotRun = {
  points: Vec[];
  temps: number[];
  /** distance travelled after i steps */
  dists: number[];
  /** first step index with T ≥ 70 °C (null if never reached) */
  finishIdx: number | null;
  /** last step index (T ≥ 95 °C, or the step cap) */
  endIdx: number;
};

function simulate(start: Vec, kind: RobotKind): RobotRun {
  let p = { ...start };
  const points = [p];
  const temps = [temperature(p.x, p.y)];
  const dists = [0];
  let d = 0;
  while (temps[temps.length - 1] < END_T && points.length <= MAX_STEPS) {
    const v = kind === "gradient" ? gradient(p.x, p.y) : { x: -p.x, y: -p.y };
    const n = Math.hypot(v.x, v.y);
    if (n < 1e-12) break;
    // the straight robot stops exactly on the source rather than overshooting it
    const s = kind === "straight" ? Math.min(STEP, n) : STEP;
    p = { x: p.x + (s * v.x) / n, y: p.y + (s * v.y) / n };
    d += s;
    points.push(p);
    temps.push(temperature(p.x, p.y));
    dists.push(d);
  }
  const f = temps.findIndex((t) => t >= FINISH_T);
  return { points, temps, dists, finishIdx: f === -1 ? null : f, endIdx: points.length - 1 };
}

export type Race = { gradient: RobotRun; straight: RobotRun; total: number };

export function simulateRace(start: Vec): Race {
  const g = simulate(start, "gradient");
  const s = simulate(start, "straight");
  return { gradient: g, straight: s, total: Math.max(g.endIdx, s.endIdx) };
}

/** A robot's state after `frame` animation steps (it waits once it reaches 95 °C). */
export function robotAt(run: RobotRun, frame: number) {
  const i = Math.min(frame, run.endIdx);
  return { i, p: run.points[i], T: run.temps[i], dist: run.dists[i] };
}

/** Final verdict once both robots have reached 70 °C at the given frame, else null. */
export function verdict(race: Race, frame: number): string | null {
  const g = race.gradient.finishIdx;
  const s = race.straight.finishIdx;
  if (g === null || s === null || frame < g || frame < s) return null;
  const dg = race.gradient.dists[g];
  const ds = race.straight.dists[s];
  if (g === s) return `It's a tie: both robots reach ${FINISH_T} °C after ${fmt(dg)} m.`;
  return g < s
    ? `The gradient robot wins: ${fmt(dg)} m against ${fmt(ds)} m to reach ${FINISH_T} °C.`
    : `The straight robot wins: ${fmt(ds)} m against ${fmt(dg)} m to reach ${FINISH_T} °C.`;
}

/** Fixed-decimal formatting that never prints "-0.00". */
export function fmt(n: number, d = 2): string {
  const s = n.toFixed(d);
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
}
