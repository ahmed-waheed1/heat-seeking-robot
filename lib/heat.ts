// Temperature model for the heat-seeking robot.
// Heat source at the origin: T(x, y) = 100·e^(−(x² + 2y²)/10) °C

export type Vec = { x: number; y: number };

export const SOURCE: Vec = { x: 0, y: 0 };
export const START: Vec = { x: 3, y: 2 };
export const DOMAIN = { xMin: -1, xMax: 4, yMin: -1, yMax: 3 } as const;

export const STEP = 0.05; // metres per gradient step
export const TARGET_T = 99; // stop once T ≥ 99 °C

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

export type PointStats = {
  T: number;
  grad: Vec;
  /** |∇T|, the fastest possible rate of increase (°C/m) */
  maxRate: number;
  /** D_u T with u pointing straight at the source; null at the source itself */
  rateToSource: number | null;
};

export function analyze(p: Vec): PointStats {
  const T = temperature(p.x, p.y);
  const g = gradient(p.x, p.y);
  const maxRate = Math.hypot(g.x, g.y);
  const dist = Math.hypot(p.x - SOURCE.x, p.y - SOURCE.y);
  const rateToSource =
    dist < 1e-9 ? null : (g.x * (SOURCE.x - p.x) + g.y * (SOURCE.y - p.y)) / dist;
  return { T, grad: g, maxRate, rateToSource };
}

export type GradientPath = {
  points: Vec[];
  /** cumulative length after i steps: lengths[i] */
  lengths: number[];
  length: number;
  steps: number;
};

/** Steepest ascent: step 0.05 m along ∇T/|∇T| until T ≥ 99 °C. */
export function gradientPath(start: Vec, step = STEP, target = TARGET_T, maxSteps = 5000): GradientPath {
  let p = { ...start };
  const points: Vec[] = [p];
  const lengths = [0];
  let length = 0;
  while (temperature(p.x, p.y) < target && points.length <= maxSteps) {
    const g = gradient(p.x, p.y);
    const n = Math.hypot(g.x, g.y);
    if (n < 1e-12) break;
    const next = { x: p.x + (step * g.x) / n, y: p.y + (step * g.y) / n };
    length += Math.hypot(next.x - p.x, next.y - p.y);
    points.push(next);
    lengths.push(length);
    p = next;
  }
  return { points, lengths, length, steps: points.length - 1 };
}

/** Precomputed results at the robot's starting point (3, 2). */
export const RESULTS = (() => {
  const s = analyze(START);
  const path = gradientPath(START);
  return { ...s, pathLength: path.length, pathSteps: path.steps };
})();

/** Fixed-decimal formatting that never prints "-0.00". */
export function fmt(n: number, d = 2): string {
  const s = n.toFixed(d);
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
}
