"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const SPORT_TYPES = ["Run", "TrailRun", "Ride", "Swim", "Walk", "Hike"];

export default function NewPlanPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGenerating(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: form.get("goal"),
          weeks: parseInt(form.get("weeks") as string) || 4,
          sport_type: form.get("sport_type"),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la génération");
        return;
      }

      const { plan } = await res.json();
      toast.success("Plan généré !");
      router.push(`/plans/${plan.id}`);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-xl px-4 py-6">
        <Link
          href="/plans"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux plans
        </Link>

        <div className="glass-card p-6">
          <h1 className="mb-1 text-lg font-semibold">Nouveau plan d&apos;entraînement</h1>
          <p className="mb-6 text-sm text-zinc-500">
            L&apos;IA génère un plan personnalisé selon ton objectif.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Objectif</label>
              <input
                name="goal"
                defaultValue="Améliorer mon endurance"
                placeholder="Préparer un semi-marathon, améliorer mon 10km..."
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sport</label>
                <select
                  name="sport_type"
                  defaultValue="Run"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {SPORT_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Durée (semaines)</label>
                <select
                  name="weeks"
                  defaultValue="4"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {[2, 3, 4, 6, 8, 12].map((w) => (
                    <option key={w} value={w}>{w} semaines</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? "Génération en cours..." : "Générer le plan"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
