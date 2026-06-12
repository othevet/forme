"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  sport_type: string | null;
  target_type: string;
  target_value: number | null;
  target_unit: string | null;
  current_value: number;
  start_date: string | null;
  target_date: string | null;
  status: string;
  created_at: string;
}

const TARGET_TYPES = [
  { value: "distance", label: "Distance", unit: "km" },
  { value: "time", label: "Temps", unit: "h" },
  { value: "frequency", label: "Fréquence", unit: "séances/sem" },
  { value: "elevation", label: "Dénivelé", unit: "m" },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d) => setGoals(d.goals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        target_type: form.get("target_type"),
        target_value: form.get("target_value"),
        target_unit: form.get("target_unit"),
        target_date: form.get("target_date"),
      }),
    });

    if (!res.ok) {
      toast.error("Erreur lors de la création");
      return;
    }

    const { goal } = await res.json();
    setGoals((prev) => [goal, ...prev]);
    setShowForm(false);
    toast.success("Objectif créé !");
  }

  async function deleteGoal(id: string) {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Erreur"); return; }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success("Objectif supprimé");
  }

  const activeGoals = goals.filter((g) => g.status === "active");

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-xl font-semibold">Objectifs</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvel objectif
          </button>
        </div>

        {showForm && (
          <form onSubmit={createGoal} className="glass-card mb-6 space-y-3 p-4">
            <div>
              <label className="text-xs font-medium">Titre</label>
              <input name="title" required className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Type</label>
                <select name="target_type" className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                  {TARGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Valeur cible</label>
                <input type="number" name="target_value" min="0" step="0.1" className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Unité</label>
                <input name="target_unit" placeholder="km, h, séances..." className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
              <div>
                <label className="text-xs font-medium">Date cible</label>
                <input type="date" name="target_date" className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Description</label>
              <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </div>
            <button type="submit" className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              Créer l&apos;objectif
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Chargement...</p>
        ) : activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((g) => {
              const pct = g.target_value && g.target_value > 0
                ? Math.min(100, Math.round((g.current_value / g.target_value) * 100))
                : 0;
              return (
                <div key={g.id} className="glass-card rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{g.title}</h3>
                      <p className="text-xs text-zinc-500">
                        {g.target_type} · {g.target_value}{g.target_unit ?? ""}
                        {g.target_date ? ` avant le ${new Date(g.target_date).toLocaleDateString("fr-FR")}` : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteGoal(g.id)} className="p-1 text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{g.current_value}{g.target_unit ?? ""} / {g.target_value}{g.target_unit ?? ""}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-lg p-8 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500">
              Aucun objectif pour le moment. Fixe-toi un défi !
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
