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
    <figure className="overflow-hidden rounded-2xl bg-ink text-[#E9EEF2]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <span className="font-mono text-sm text-[#AEBBC7]">{filename}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {status === "copied" ? "Copied ✓" : status === "failed" ? "Copy failed" : "Copy"}
        </button>
        <span className="sr-only" aria-live="polite">
          {status === "copied" ? "Code copied to clipboard" : status === "failed" ? "Copy failed" : ""}
        </span>
      </figcaption>
      <pre tabIndex={0} aria-label={`${filename} source code`} className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed sm:text-sm">
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  );
}
