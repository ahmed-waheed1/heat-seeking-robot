import { fmt } from "@/lib/heat";
import type { RobotRun } from "@/lib/useRobotRun";

type Props = { run: RobotRun; compact?: boolean };

export function Readouts({ run, compact = false }: Props) {
  const { current, stats, path, progress, travelled, done } = run;
  const rows: [string, string, string?][] = [
    ["Position", `(${fmt(current.x)}, ${fmt(current.y)})`, "m"],
    ["Temperature T", fmt(stats.T), "°C"],
    ["Fastest rate |∇T|", fmt(stats.maxRate), "°C/m"],
    ["Rate straight at source", stats.rateToSource === null ? "—" : fmt(stats.rateToSource), "°C/m"],
    ["Path length", progress > 0 ? fmt(travelled) : `${fmt(path.length)} planned`, "m"],
    ["Steps", progress > 0 ? `${Math.min(progress, path.steps)} / ${path.steps}` : `${path.steps} planned`],
  ];

  return (
    <div>
      <dl className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2"}`}>
        {rows.map(([label, value, unit]) => (
          <div key={label} className="rounded-[12px] bg-card px-3 py-2.5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-0.5 font-mono text-[15px] font-medium text-ink tabular-nums">
              {value}
              {unit && <span className="ml-1 text-muted text-xs">{unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="sr-only" aria-live="polite">
        {done
          ? `Reached ${fmt(stats.T)} degrees after ${path.steps} steps and ${fmt(path.length)} metres.`
          : ""}
      </p>
    </div>
  );
}
