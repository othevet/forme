import { createClient } from "@/lib/supabase/server";
import { WeeklyChart } from "./weekly-chart";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Global stats
  const { data: stats } = await supabase
    .from("workouts")
    .select("distance_meters, moving_time_seconds, calories, average_heartrate, sport_type, start_date")
    .eq("user_id", user.id);

  // Weekly aggregates
  const { data: weekly } = await supabase
    .from("workouts")
    .select("start_date, distance_meters, moving_time_seconds, sport_type")
    .eq("user_id", user.id)
    .gte("start_date", new Date(Date.now() - 90 * 86400000).toISOString())
    .order("start_date", { ascending: true });

  if (!stats || stats.length === 0) {
    return (
      <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="glass-card p-6 text-center text-sm text-zinc-500">
            Pas encore de données. Synchronise des séances Strava pour voir tes stats.
          </div>
        </div>
      </main>
    );
  }

  const totalDistance = stats.reduce((s, w) => s + (w.distance_meters ?? 0), 0);
  const totalTime = stats.reduce((s, w) => s + (w.moving_time_seconds ?? 0), 0);
  const totalCalories = stats.reduce((s, w) => s + (w.calories ?? 0), 0);
  const avgHrWorkouts = stats.filter((w) => w.average_heartrate);
  const avgHr = avgHrWorkouts.length > 0 ? avgHrWorkouts.reduce((s, w) => s + w.average_heartrate!, 0) / avgHrWorkouts.length : 0;
  const workoutCount = stats.length;

  // Sport breakdown by count + duration
  const bySportCount: Record<string, { count: number; duration: number; distance: number }> = {};
  stats.forEach((w) => {
    const k = w.sport_type ?? "Autre";
    if (!bySportCount[k]) bySportCount[k] = { count: 0, duration: 0, distance: 0 };
    bySportCount[k].count++;
    bySportCount[k].duration += w.moving_time_seconds ?? 0;
    bySportCount[k].distance += w.distance_meters ?? 0;
  });

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const weekData = buildWeeklyData(weekly ?? []);

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="glass-card p-6">
          <h1 className="text-lg font-semibold">Statistiques</h1>
          <p className="text-sm text-zinc-500">{workoutCount} séances au total</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{(totalDistance / 1000).toFixed(0)}</p>
            <p className="text-xs text-zinc-500">km parcourus</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{formatTime(totalTime)}</p>
            <p className="text-xs text-zinc-500">temps total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{Math.round(avgHr)}</p>
            <p className="text-xs text-zinc-500">FC moyenne</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{Math.round(totalCalories / 1000)}k</p>
            <p className="text-xs text-zinc-500">kcal brûlées</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Weekly chart */}
          <div className="glass-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Distance par semaine</h2>
            <WeeklyChart data={weekData} />
          </div>

          {/* Sport breakdown */}
          <div className="glass-card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Par sport</h2>
            <div className="space-y-3">
              {Object.entries(bySportCount)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 6)
                .map(([sport, info]) => {
                  const maxCount = Math.max(...Object.values(bySportCount).map((v) => v.count));
                  return (
                    <div key={sport}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{sport}</span>
                        <span className="text-zinc-500">
                          {info.count} séances
                          {info.distance > 0 ? ` · ${(info.distance / 1000).toFixed(0)} km` : ""}
                          {info.duration > 0 ? ` · ${formatTime(info.duration)}` : ""}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100"
                          style={{ width: `${(info.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function buildWeeklyData(workouts: { start_date: string; distance_meters: number | null; moving_time_seconds: number | null }[]) {
  const weeks: Record<string, number> = {};
  const now = new Date();
  // Init last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    const key = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    weeks[key] = 0;
  }
  workouts.forEach((w) => {
    if (!w.start_date || !w.distance_meters) return;
    const d = new Date(w.start_date);
    const key = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    if (key in weeks) weeks[key] += w.distance_meters / 1000;
  });
  return Object.entries(weeks).map(([name, km]) => ({ name, km: Math.round(km * 10) / 10 }));
}
