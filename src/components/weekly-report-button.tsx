"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export function WeeklyReportButton() {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/weekly");
      if (!res.ok) {
        toast.error("Erreur lors de la génération");
        return;
      }
      const { report } = await res.json();
      toast.success(`Rapport : ${report.summary.totalWorkouts} séances, ${(report.summary.totalDistance / 1000).toFixed(1)} km`);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
    >
      <FileText className="h-3.5 w-3.5" />
      {loading ? "Génération..." : "Rapport hebdo"}
    </button>
  );
}
