import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SyncButton } from "@/components/sync-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: strava } = await supabase
    .from("strava_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("id, name, sport_type, distance_meters, moving_time_seconds, start_date, average_heartrate")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(5);

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h1 className="text-xl font-semibold">
              Bon retour, {profile?.display_name ?? "Sportif"} 👋
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {profile?.login_message ?? "Voici ton résumé des dernières séances."}
            </p>
          </div>

          {!strava && (
            <div className="glass-card p-6 text-center">
              <h2 className="mb-2 text-base font-medium">Connecte ton compte Strava</h2>
              <p className="mb-4 text-sm text-zinc-500">
                Pour importer automatiquement tes séances et recevoir des conseils personnalisés.
              </p>
              <a
                href="/api/strava/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.526l-4.116 8.28-2.762-6.256h2.762l2.116 3.877 2.45-4.9z" />
                </svg>
                Se connecter avec Strava
              </a>
            </div>
          )}

          {strava && (
            <>
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Dernières séances</h2>
                  <SyncButton userId={user.id} />
                </div>
                {recentWorkouts && recentWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {recentWorkouts.map((w) => (
                      <Link
                        key={w.id}
                        href={`/workouts/${w.id}`}
                        className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                      >
                        <div>
                          <p className="font-medium">{w.name ?? "Séance"}</p>
                          <p className="text-xs text-zinc-500">
                            {w.sport_type} · {w.distance_meters ? `${(w.distance_meters / 1000).toFixed(1)} km` : "-"}
                            {w.average_heartrate ? ` · ${Math.round(w.average_heartrate)} bpm` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {w.start_date ? new Date(w.start_date).toLocaleDateString("fr-FR") : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Aucune séance pour le moment. Sync en cours...</p>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="mb-3 text-sm font-semibold">Coach IA</h2>
                <p className="text-sm text-zinc-500">
                  Analyse tes séances et obtiens des conseils personnalisés.
                </p>
                <a
                  href="/coach"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  Parler au coach →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
