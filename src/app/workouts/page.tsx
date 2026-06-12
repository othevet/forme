import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const COMMON_SPORTS = ["", "Run", "TrailRun", "Ride", "MountainBikeRide", "Swim", "Walk", "Hike", "Workout", "VirtualRide"];

const sportIcons: Record<string, string> = {
  Run: "🏃", TrailRun: "🏔️", Ride: "🚴", MountainBikeRide: "🚵",
  Swim: "🏊", Walk: "🚶", Hike: "🥾", Workout: "🏋️",
  WeightTraining: "🏋️", Yoga: "🧘", VirtualRide: "🚴",
};

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;

  let query = supabase
    .from("workouts")
    .select("id, name, sport_type, distance_meters, moving_time_seconds, start_date, average_heartrate, average_speed, total_elevation_gain, calories", { count: "exact" })
    .eq("user_id", user.id);

  if (params.sport) {
    query = query.eq("sport_type", params.sport);
  }
  if (params.from) {
    query = query.gte("start_date", params.from);
  }
  if (params.to) {
    query = query.lte("start_date", params.to);
  }

  const { data: workouts, count } = await query
    .order("start_date", { ascending: false })
    .limit(200);

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Séances</h1>
              <p className="text-sm text-zinc-500">{count ?? 0} séances</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/workouts/calendar"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendrier
              </Link>
              <Link
                href="/workouts/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouvelle
              </Link>
            </div>
          </div>

          <form className="mb-4 flex flex-wrap gap-2">
            <select
              name="sport"
              defaultValue={params.sport ?? ""}
              onChange={(e) => e.target.form?.requestSubmit()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Tous les sports</option>
              {COMMON_SPORTS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              onChange={(e) => e.target.form?.requestSubmit()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              title="Du"
            />
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              onChange={(e) => e.target.form?.requestSubmit()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              title="Au"
            />
            {(params.sport || params.from || params.to) && (
              <Link
                href="/workouts"
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Réinitialiser
              </Link>
            )}
          </form>

          {workouts && workouts.length > 0 ? (
            <div className="space-y-2">
              {workouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/workouts/${w.id}`}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{sportIcons[w.sport_type] ?? "📊"}</span>
                    <div>
                      <p className="font-medium">{w.name ?? "Séance"}</p>
                      <p className="text-xs text-zinc-500">
                        {w.sport_type?.replace(/([A-Z])/g, " $1").trim() ?? "Sport"}
                        {w.distance_meters ? ` · ${(w.distance_meters / 1000).toFixed(1)} km` : ""}
                        {w.moving_time_seconds ? ` · ${Math.floor(w.moving_time_seconds / 60)} min` : ""}
                        {w.average_heartrate ? ` · ${Math.round(w.average_heartrate)} bpm` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <p>{w.start_date ? new Date(w.start_date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : ""}</p>
                    {w.calories ? <p>{Math.round(w.calories)} kcal</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">
              Aucune séance pour le moment.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
