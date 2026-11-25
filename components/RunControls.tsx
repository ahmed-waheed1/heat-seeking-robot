import type { RobotRun } from "@/lib/useRobotRun";

export function RunControls({ run }: { run: RobotRun }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={run.run}
        disabled={run.running || run.path.steps === 0}
        className="rounded-[12px] bg-ember px-5 py-2.5 font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {run.running ? "Running…" : run.done ? "Run again" : "Run"}
      </button>
      <button
        type="button"
        onClick={run.reset}
        className="rounded-[12px] border border-forest/30 bg-white/60 px-4 py-2.5 font-semibold text-forest transition hover:bg-white"
      >
        Back to (3, 2)
      </button>
    </div>
  );
}
