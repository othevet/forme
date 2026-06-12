"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Dumbbell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const SPORT_TYPES = ["Run", "Ride", "Swim", "Walk", "Hike", "TrailRun", "VirtualRun", "VirtualRide", "Workout"];

export default function NewWorkoutPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/workouts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          sport_type: form.get("sport_type"),
          description: form.get("description"),
          distance_meters: form.get("distance_meters"),
          moving_time_seconds: form.get("moving_time_seconds"),
          start_date: form.get("start_date") || new Date().toISOString(),
          average_heartrate: form.get("average_heartrate"),
          total_elevation_gain: form.get("total_elevation_gain"),
          average_speed: form.get("average_speed"),
          calories: form.get("calories"),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la création");
        return;
      }

      const { workout } = await res.json();
      toast.success("Séance créée !");
      router.push(`/workouts/${workout.id}`);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/workouts"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux séances
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <Dumbbell className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
          <h1 className="text-xl font-semibold">Nouvelle séance</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Nom</label>
              <input
                name="name"
                defaultValue="Séance manuelle"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type de sport</label>
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
              <label className="text-sm font-medium">Date et heure</label>
              <input
                type="datetime-local"
                name="start_date"
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Distance (mètres)</label>
              <input
                type="number"
                name="distance_meters"
                placeholder="5000"
                min="0"
                step="1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Durée (secondes)</label>
              <input
                type="number"
                name="moving_time_seconds"
                placeholder="1800"
                min="0"
                step="1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">FC moyenne (bpm)</label>
              <input
                type="number"
                name="average_heartrate"
                placeholder="145"
                min="0"
                step="1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Dénivelé (mètres)</label>
              <input
                type="number"
                name="total_elevation_gain"
                placeholder="120"
                min="0"
                step="1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Vitesse moyenne (m/s)</label>
              <input
                type="number"
                name="average_speed"
                placeholder="3.5"
                min="0"
                step="0.1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Calories</label>
              <input
                type="number"
                name="calories"
                placeholder="350"
                min="0"
                step="1"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description (optionnelle)</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Séance tranquille..."
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            {saving ? "Création..." : "Créer la séance"}
          </button>
        </form>
      </div>
    </main>
  );
}
