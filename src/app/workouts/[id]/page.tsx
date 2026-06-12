import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Clock, Route, Heart, Zap, Mountain, Gauge, Flame, Timer } from "lucide-react";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workout } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workout) notFound();

  const { data: splits } = await supabase
    .from("workout_splits")
    .select("*")
    .eq("workout_id", workout.id)
    .order("split", { ascending: true });

  const sportIcons: Record<string, string> = {
    Run: "🏃", TrailRun: "🏔️", Ride: "🚴", MountainBikeRide: "🚵",
    Swim: "🏊", Walk: "🚶", Hike: "🥾", Workout: "🏋️",
    WeightTraining: "🏋️", Yoga: "🧘", VirtualRide: "🚴",
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const formatPace = (speed: number) => {
    if (!speed || speed === 0) return "-";
    const paceSec = 1000 / speed / 60;
    const min = Math.floor(paceSec);
    const sec = Math.round((paceSec - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")} /km`;
  };

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href="/workouts"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour aux séances
        </Link>

        <div className="glass-card p-6">
          <div className="mb-6 flex items-start gap-4">
            <span className="text-3xl">{sportIcons[workout.sport_type] ?? "📊"}</span>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{workout.name ?? "Séance"}</h1>
              <p className="text-sm text-zinc-500">
                {workout.sport_type?.replace(/([A-Z])/g, " $1").trim() ?? "Sport"}
                {workout.start_date && ` · ${new Date(workout.start_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {workout.distance_meters != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Route className="h-3 w-3" />
                  Distance
                </div>
                <p className="text-lg font-semibold">{(workout.distance_meters / 1000).toFixed(2)} km</p>
              </div>
            )}
            {workout.moving_time_seconds != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Clock className="h-3 w-3" />
                  Durée
                </div>
                <p className="text-lg font-semibold">{formatDuration(workout.moving_time_seconds)}</p>
              </div>
            )}
            {workout.average_heartrate != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Heart className="h-3 w-3" />
                  FC moyenne
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.average_heartrate)} bpm</p>
              </div>
            )}
            {workout.max_heartrate != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Heart className="h-3 w-3" />
                  FC max
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.max_heartrate)} bpm</p>
              </div>
            )}
            {workout.average_speed != null && workout.sport_type?.includes("Run") && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Gauge className="h-3 w-3" />
                  Allure
                </div>
                <p className="text-lg font-semibold">{formatPace(workout.average_speed)}</p>
              </div>
            )}
            {workout.average_speed != null && !workout.sport_type?.includes("Run") && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Gauge className="h-3 w-3" />
                  Vitesse moy.
                </div>
                <p className="text-lg font-semibold">{(workout.average_speed * 3.6).toFixed(1)} km/h</p>
              </div>
            )}
            {workout.total_elevation_gain != null && workout.total_elevation_gain > 0 && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Mountain className="h-3 w-3" />
                  Dénivelé
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.total_elevation_gain)} m</p>
              </div>
            )}
            {workout.average_cadence != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  Cadence
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.average_cadence)} spm</p>
              </div>
            )}
            {workout.average_watts != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Zap className="h-3 w-3" />
                  Puissance moy.
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.average_watts)} W</p>
              </div>
            )}
            {workout.max_watts != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Zap className="h-3 w-3" />
                  Puissance max
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.max_watts)} W</p>
              </div>
            )}
            {workout.calories != null && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Flame className="h-3 w-3" />
                  Calories
                </div>
                <p className="text-lg font-semibold">{Math.round(workout.calories)} kcal</p>
              </div>
            )}
          </div>

          {splits && splits.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Timer className="h-3 w-3" />
                Temps intermédiaires
              </h3>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                      <th className="px-3 py-2 font-medium">Km</th>
                      <th className="px-3 py-2 font-medium">Temps</th>
                      <th className="px-3 py-2 font-medium">Allure</th>
                      <th className="px-3 py-2 font-medium">FC</th>
                      <th className="px-3 py-2 font-medium">Dénivelé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splits.map((s) => {
                      const paceMin = Math.floor((s.pace_seconds ?? 0) / 60);
                      const paceSec = Math.round((s.pace_seconds ?? 0) % 60);
                      const paceStr = paceMin > 0 ? `${paceMin}:${paceSec.toString().padStart(2, "0")}` : "-";
                      const timeMin = Math.floor((s.moving_time_seconds ?? 0) / 60);
                      const timeSec = (s.moving_time_seconds ?? 0) % 60;
                      return (
                        <tr key={s.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                          <td className="px-3 py-2 font-medium">{s.split}</td>
                          <td className="px-3 py-2">{timeMin}:{timeSec.toString().padStart(2, "0")}</td>
                          <td className="px-3 py-2">{paceStr}</td>
                          <td className="px-3 py-2">{s.average_heartrate ? Math.round(s.average_heartrate) : "-"}</td>
                          <td className="px-3 py-2">{s.elevation_difference ? `${s.elevation_difference > 0 ? "+" : ""}${Math.round(s.elevation_difference)} m` : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {workout.description && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{workout.description}</p>
            </div>
          )}

          <div className="mt-6 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
            {workout.device_name && <p>Appareil : {workout.device_name}</p>}
            {workout.gear_id && <p>Équipement : {workout.gear_id}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
