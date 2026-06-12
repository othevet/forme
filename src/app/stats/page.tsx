import { createClient } from "@/lib/supabase/server";
import { MonthlyChart } from "./monthly-chart";
import { WeeklyReportButton } from "@/components/weekly-report-button";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: stats } = await supabase
    .from("workouts")
    .select("distance_meters, moving_time_seconds, calories, average_heartrate, sport_type, start_date, total_elevation_gain")
    .eq("user_id", user.id);

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
  const avgHr = avgHrWorkouts.length > 0
    ? avgHrWorkouts.reduce((s, w) => s + w.average_heartrate!, 0) / avgHrWorkouts.length
    : 0;

  const monthlyStats = buildMonthlyData(stats);
  const totalElevation = stats.reduce((s, w) => s + (w.total_elevation_gain ?? 0), 0);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard value={(totalDistance / 1000).toFixed(0)} label="km parcourus" />
            <MetricCard value={formatTime(totalTime)} label="temps total" />
            <MetricCard value={Math.round(avgHr).toString()} label="FC moyenne" />
            <MetricCard value={`${Math.round(totalCalories / 1000)}k`} label="kcal brûlées" />
          </div>
          <WeeklyReportButton />
        </div>

        <div className="glass-card p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Distance par mois</h2>
          <MonthlyChart data={monthlyStats} />
        </div>
      </div>
    </main>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

const MONTHS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juill.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

function buildMonthlyData(workouts: { start_date: string; distance_meters: number | null }[]) {
  const months: Record<string, number> = {};
  for (const w of workouts) {
    if (!w.start_date || !w.distance_meters) continue;
    const d = new Date(w.start_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months[key] = (months[key] ?? 0) + w.distance_meters / 1000;
  }
  return Object.entries(months)
    .map(([key, km]) => {
      const [y, m] = key.split("-").map(Number);
      return { name: `${MONTHS[m]} ${y}`, km: Math.round(km * 10) / 10 };
    });
}
