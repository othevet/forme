import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, name, sport_type, distance_meters, moving_time_seconds, start_date, average_heartrate, average_speed, total_elevation_gain, calories")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(50);

  const sportIcons: Record<string, string> = {
    Run: "🏃", TrailRun: "🏔️", Ride: "🚴", MountainBikeRide: "🚵",
    Swim: "🏊", Walk: "🚶", Hike: "🥾", Workout: "🏋️",
    WeightTraining: "🏋️", Yoga: "🧘", VirtualRide: "🚴",
  };

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="glass-card p-6">
          <h1 className="mb-1 text-lg font-semibold">Séances</h1>
          <p className="mb-6 text-sm text-zinc-500">{workouts?.length ?? 0} séances importées</p>

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
              Aucune séance pour le moment. Importe tes données depuis Strava dans les réglages.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
