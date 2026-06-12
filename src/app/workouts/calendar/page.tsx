"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";

interface WorkoutDay {
  date: string;
  count: number;
  totalDistance: number;
}

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarPage() {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];

    fetch(`/api/workouts/calendar?from=${start}&to=${end}`)
      .then((r) => r.json())
      .then((d) => setWorkouts(d.days ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const workoutMap = new Map(workouts.map((w) => [w.date, w]));

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h1 className="text-lg font-semibold">Calendrier</h1>
            </div>
            <Link
              href="/workouts"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </Link>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{MONTHS[month]} {year}</span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-medium uppercase text-zinc-400">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const w = workoutMap.get(dateStr);

              return (
                <Link
                  key={day}
                  href={w ? `/workouts?from=${dateStr}&to=${dateStr}` : "#"}
                  className={`flex flex-col items-center rounded-lg py-2 text-sm transition-colors ${
                    w
                      ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className={w ? "font-medium" : "text-zinc-400"}>{day}</span>
                  {w && (
                    <span className="mt-0.5 text-[9px] text-zinc-500">
                      {w.totalDistance > 0
                        ? `${(w.totalDistance / 1000).toFixed(0)}km`
                        : `${w.count}s`}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {loading && (
            <p className="mt-4 text-center text-sm text-zinc-500">Chargement...</p>
          )}
        </div>
      </div>
    </main>
  );
}
