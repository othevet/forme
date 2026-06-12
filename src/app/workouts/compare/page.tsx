"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown, Minus, Activity } from "lucide-react";

interface Workout {
  id: number;
  name: string | null;
  sport_type: string | null;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  elapsed_time_seconds: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_speed: number | null;
  max_speed: number | null;
  total_elevation_gain: number | null;
  average_cadence: number | null;
  average_watts: number | null;
  max_watts: number | null;
  calories: number | null;
  start_date: string | null;
}

interface Split {
  split: number;
  distance_meters: number | null;
  moving_time_seconds: number | null;
  average_heartrate: number | null;
  average_speed: number | null;
  elevation_difference: number | null;
  pace_seconds: number | null;
}

function Diff({ v1, v2, fmt }: { v1: number | null; v2: number | null; fmt: (v: number) => string }) {
  if (v1 == null || v2 == null) return <span className="text-zinc-400">—</span>;
  const diff = v2 - v1;
  const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : Minus;
  const color = diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-zinc-400";
  return (
    <span className={`inline-flex items-center gap-0.5 ${color}`}>
      <Icon className="h-3 w-3" />
      {fmt(Math.abs(diff))}
    </span>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id1 = searchParams.get("id1");
  const id2 = searchParams.get("id2");
  const [loading, setLoading] = useState(true);
  const [w1, setW1] = useState<Workout | null>(null);
  const [w2, setW2] = useState<Workout | null>(null);
  const [s1, setS1] = useState<Split[]>([]);
  const [s2, setS2] = useState<Split[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (!id1) return;

    if (id1 && id2) {
      fetch(`/api/workouts/compare?id1=${id1}&id2=${id2}`)
        .then((r) => r.json())
        .then((d) => {
          setW1(d.workout1);
          setW2(d.workout2);
          setS1(d.splits1 ?? []);
          setS2(d.splits2 ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/workouts/compare?id1=${id1}&id2=${id1}`)
        .then((r) => r.json())
        .then((d) => {
          setW1(d.workout1);
          setW2(null);
          setS1(d.splits1 ?? []);
          setS2([]);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id1, id2]);

  useEffect(() => {
    fetch("/api/workouts")
      .then((r) => r.json())
      .then((d) => setAllWorkouts(d.workouts ?? []))
      .catch(() => {});
  }, []);

  if (!id1) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="glass-card p-6">
            <h2 className="mb-1 text-lg font-semibold">Comparer des séances</h2>
            <p className="mb-4 text-sm text-zinc-500">
              Sélectionne deux séances depuis la liste.
            </p>
            <Link
              href="/workouts"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Voir les séances →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (id1 && !id2) {
    const filtered = allWorkouts.filter((w) => w.id !== parseInt(id1));
    return (
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/workouts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <ArrowLeft className="h-4 w-4" />
            Retour aux séances
          </Link>
          <div className="glass-card p-6">
            <h2 className="mb-1 text-lg font-semibold">
              Comparer avec {w1?.name ?? "la séance"}
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              Choisis une deuxième séance à comparer.
            </p>
            <div className="space-y-1">
              {filtered.map((w) => (
                <button
                  key={w.id}
                  onClick={() => router.push(`/workouts/compare?id1=${id1}&id2=${w.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Activity className="h-4 w-4 text-zinc-400" />
                  <span className="flex-1 font-medium">{w.name ?? "Séance"}</span>
                  <span className="text-xs text-zinc-400">
                    {w.sport_type} · {w.start_date ? new Date(w.start_date).toLocaleDateString("fr-FR") : ""}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-zinc-400">Aucune autre séance disponible.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  function paceStr(ms: number | null): string {
    if (!ms) return "-";
    const min = Math.floor(ms / 60);
    const sec = Math.round(ms % 60);
    return `${min}:${String(sec).padStart(2, "0")} /km`;
  }

  function fmtNum(v: number | null, suffix = ""): string {
    if (v == null) return "-";
    return `${Math.round(v * 10) / 10}${suffix}`;
  }

  const fields: { label: string; key: keyof Workout; fmt: (v: number | null) => string }[] = [
    { label: "Distance", key: "distance_meters", fmt: (v) => v ? `${(v / 1000).toFixed(2)} km` : "-" },
    { label: "Durée", key: "moving_time_seconds", fmt: (v) => v ? `${Math.floor(v / 60)} min` : "-" },
    { label: "FC moyenne", key: "average_heartrate", fmt: (v) => v ? `${Math.round(v)} bpm` : "-" },
    { label: "FC max", key: "max_heartrate", fmt: (v) => v ? `${Math.round(v)} bpm` : "-" },
    { label: "Allure", key: "average_speed", fmt: (v) => v ? `${(v * 3.6).toFixed(1)} km/h` : "-" },
    { label: "Dénivelé", key: "total_elevation_gain", fmt: (v) => v ? `${Math.round(v)} m` : "-" },
    { label: "Calories", key: "calories", fmt: (v) => v ? `${Math.round(v)} kcal` : "-" },
    { label: "Cadence", key: "average_cadence", fmt: (v) => v ? `${Math.round(v)} spm` : "-" },
    { label: "Puissance moy.", key: "average_watts", fmt: (v) => v ? `${Math.round(v)} W` : "-" },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href="/workouts"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux séances
        </Link>

        {loading ? (
          <p className="text-sm text-zinc-500">Chargement...</p>
        ) : (
          <>
            <div className="glass-card mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="p-3 text-left font-medium text-zinc-500">Métrique</th>
                    <th className="p-3 text-right font-medium">
                      <Link href={`/workouts/${w1?.id}`} className="hover:underline">
                        {w1?.name ?? "Séance 1"}
                      </Link>
                      <p className="text-[10px] text-zinc-400">{w1?.start_date ? new Date(w1.start_date).toLocaleDateString("fr-FR") : ""}</p>
                    </th>
                    <th className="p-3 text-right font-medium">
                      <Link href={`/workouts/${w2?.id}`} className="hover:underline">
                        {w2?.name ?? "Séance 2"}
                      </Link>
                      <p className="text-[10px] text-zinc-400">{w2?.start_date ? new Date(w2.start_date).toLocaleDateString("fr-FR") : ""}</p>
                    </th>
                    <th className="p-3 text-right font-medium text-zinc-500">Différence</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f) => (
                    <tr key={f.key} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="p-3 text-zinc-500">{f.label}</td>
                      <td className="p-3 text-right font-medium">{f.fmt(w1?.[f.key] ?? null)}</td>
                      <td className="p-3 text-right font-medium">{f.fmt(w2?.[f.key] ?? null)}</td>
                      <td className="p-3 text-right">
                        <Diff
                          v1={w1?.[f.key] ?? null}
                          v2={w2?.[f.key] ?? null}
                          fmt={(v) => f.fmt(v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {s1.length > 0 && s2.length > 0 && (
              <div className="glass-card overflow-x-auto">
                <h3 className="p-4 pb-0 text-sm font-semibold">Comparaison des splits</h3>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="p-3 text-left font-medium text-zinc-500">Split</th>
                      <th className="p-3 text-right font-medium text-zinc-500">Allure 1</th>
                      <th className="p-3 text-right font-medium text-zinc-500">Allure 2</th>
                      <th className="p-3 text-right font-medium text-zinc-500">FC 1</th>
                      <th className="p-3 text-right font-medium text-zinc-500">FC 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s1.map((split, i) => {
                      const s2Split = s2[i];
                      return (
                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900">
                          <td className="p-3 text-zinc-500">{split.split} km</td>
                          <td className="p-3 text-right">{paceStr(split.pace_seconds)}</td>
                          <td className="p-3 text-right">{s2Split ? paceStr(s2Split.pace_seconds) : "-"}</td>
                          <td className="p-3 text-right">{fmtNum(split.average_heartrate, " bpm")}</td>
                          <td className="p-3 text-right">{s2Split ? fmtNum(s2Split.average_heartrate, " bpm") : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
