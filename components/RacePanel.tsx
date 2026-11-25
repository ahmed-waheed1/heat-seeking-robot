import { END_T, fmt, FINISH_T, gradientRate, straightRate } from "@/lib/heat";
import type { RaceState } from "@/lib/useRace";

/** The two lane cards with live T and rate. */
export function Lanes({ race }: { race: RaceState }) {
  const lanes = [
    {
      key: "gradient",
      label: "Gradient robot",
      note: "follows ∇T",
      dot: "bg-coral",
      r: race.gradient,
      rate: gradientRate(race.gradient.p),
    },
    {
      key: "straight",
      label: "Straight robot",
      note: "aims at source",
      dot: "bg-slate",
      r: race.straight,
      rate: straightRate(race.straight.p),
    },
  ] as const;

  return (
    <div className="@container"><div className="grid gap-3 @md:grid-cols-2">
      {lanes.map((l) => (
        <section key={l.key} aria-label={`${l.label} (${l.note})`} className="rounded-2xl border border-line bg-paper p-4">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold leading-tight">
            <span aria-hidden className={`inline-block h-3 w-3 shrink-0 rounded-full ${l.dot}`} />
            <span>
              {l.label} <span className="font-normal text-muted">({l.note})</span>
            </span>
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 font-mono">
            <div>
              <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">T</dt>
              <dd className="text-xl font-medium tabular-nums">
                {fmt(l.r.T)}
                <span className="ml-1 text-sm text-muted">°C</span>
              </dd>
            </div>
            <div>
              <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">Rate</dt>
              <dd className="text-xl font-medium tabular-nums">
                {l.rate === null ? "—" : fmt(l.rate)}
                <span className="ml-1 text-sm text-muted">°C/m</span>
              </dd>
            </div>
          </dl>
          <p className="mt-1 font-mono text-xs text-muted tabular-nums">{fmt(l.r.dist)} m travelled</p>
        </section>
      ))}
      </div>
    </div>
  );
}

/** Temperature vs distance travelled, for both robots. */
export function RaceChart({ race }: { race: RaceState }) {
  const W = 420;
  const H = 220;
  const pad = { l: 38, r: 12, t: 12, b: 32 };
  const { gradient: g, straight: s } = race.race;
  const maxD = Math.max(0.5, Math.ceil(Math.max(g.dists[g.endIdx], s.dists[s.endIdx]) * 2) / 2);
  const x = (d: number) => pad.l + (d / maxD) * (W - pad.l - pad.r);
  const y = (t: number) => pad.t + (1 - t / 100) * (H - pad.t - pad.b);
  const line = (run: typeof g, upto: number) =>
    run.temps
      .slice(0, upto + 1)
      .map((t, i) => `${i ? "L" : "M"}${x(run.dists[i]).toFixed(1)},${y(t).toFixed(1)}`)
      .join("");
  const xticks = Array.from({ length: Math.round(maxD / 0.5) + 1 }, (_, i) => i * 0.5);

  return (
    <figure className="rounded-2xl border border-line bg-paper p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Temperature against distance travelled. Gradient robot now at ${fmt(race.gradient.T)} °C after ${fmt(race.gradient.dist)} m; straight robot at ${fmt(race.straight.T)} °C after ${fmt(race.straight.dist)} m. Finish line at ${FINISH_T} °C.`}
      >
        {[0, 20, 40, 60, 80, 100].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E3DBD0" strokeWidth={1} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#5B6B7A" className="font-mono">
              {t}
            </text>
          </g>
        ))}
        {xticks.map((d) => (
          <text key={d} x={x(d)} y={H - pad.b + 16} textAnchor="middle" fontSize={11} fill="#5B6B7A" className="font-mono">
            {d % 1 === 0 ? d : d.toFixed(1)}
          </text>
        ))}
        <text x={W - pad.r} y={H - 3} textAnchor="end" fontSize={11} fill="#5B6B7A">
          distance (m)
        </text>
        <text x={pad.l + 4} y={pad.t + 10} fontSize={11} fill="#5B6B7A">
          T (°C)
        </text>
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(FINISH_T)}
          y2={y(FINISH_T)}
          stroke="#C9472E"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text x={W - pad.r - 2} y={y(FINISH_T) - 6} textAnchor="end" fontSize={11} fill="#C9472E" fontWeight={600}>
          finish {FINISH_T} °C
        </text>
        <path d={line(s, race.straight.i)} fill="none" stroke="#5B6B7A" strokeWidth={2.25} strokeDasharray="6 4" strokeLinejoin="round" />
        <path d={line(g, race.gradient.i)} fill="none" stroke="#C9472E" strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={x(race.straight.dist)} cy={y(race.straight.T)} r={4} fill="#5B6B7A" stroke="#fff" strokeWidth={1.5} />
        <circle cx={x(race.gradient.dist)} cy={y(race.gradient.T)} r={4} fill="#C9472E" stroke="#fff" strokeWidth={1.5} />
      </svg>
    </figure>
  );
}

const pill = "rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export function RaceControls({ race }: { race: RaceState }) {
  const { status } = race;
  const main =
    status === "running"
      ? { label: "Pause", on: race.pause }
      : status === "paused"
        ? { label: "Resume", on: race.resume }
        : status === "done"
          ? { label: "Race again", on: race.startRace }
          : { label: "Start the race", on: race.startRace };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={main.on} className={`${pill} bg-ink text-white hover:bg-[#33424f]`}>
        {main.label}
      </button>
      <button type="button" onClick={race.reset} className={`${pill} border border-line bg-paper text-ink hover:bg-sand`}>
        Back to (3, 2)
      </button>
    </div>
  );
}

export function Verdict({ race }: { race: RaceState }) {
  const text =
    race.verdict ??
    (race.status === "idle"
      ? `Both robots start at (${fmt(race.start.x)}, ${fmt(race.start.y)}). Who reaches ${FINISH_T} °C first?`
      : race.status === "paused"
        ? "Paused."
        : `Racing to ${FINISH_T} °C…`);
  const tail =
    race.verdict && race.status === "done" ? ` Both robots are now past ${END_T} °C.` : "";
  return (
    <p aria-live="polite" className="font-serif text-xl font-semibold leading-snug text-ink">
      {text}
      {tail && <span className="sr-only">{tail}</span>}
    </p>
  );
}
