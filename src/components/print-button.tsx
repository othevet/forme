"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Exporter PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
    >
      <Printer className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
