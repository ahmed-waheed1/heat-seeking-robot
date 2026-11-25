"use client";

import { useState } from "react";

export function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <figure className="overflow-hidden rounded-[12px] bg-[#13241c] text-[#e4eddf] shadow-sm">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-sm text-[#a9c2b3]">{filename}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-ember px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {status === "copied" ? "Copied ✓" : status === "failed" ? "Copy failed" : "Copy"}
        </button>
        <span className="sr-only" aria-live="polite">
          {status === "copied" ? "Code copied to clipboard" : status === "failed" ? "Copy failed" : ""}
        </span>
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed sm:text-sm" tabIndex={0} aria-label={`${filename} source code`}>
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  );
}
