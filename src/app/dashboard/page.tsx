import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SyncButton } from "@/components/sync-button";
import { Calendar, Target, Award } from "lucide-react";
import { computeBadges } from "@/lib/utils/badges";

interface PlanSession {
  day: string;
  type: string;
  description: string;
  duration: string;
}

interface PlanWeek {
  week: number;
  theme: string;
  description: string;
  sessions: PlanSession[];
}

interface PlanJSON {
  title: string;
  goal: string;
  overview: string;
  weeks: PlanWeek[];
}

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

  const { data: latestPlan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let currentWeek: PlanWeek | null = null;
  if (latestPlan?.plan_json) {
    const planData = latestPlan.plan_json as PlanJSON;
    const weeksSinceCreation = Math.floor(
      (Date.now() - new Date(latestPlan.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const weekIndex = Math.min(weeksSinceCreation, (planData.weeks?.length ?? 1) - 1);
    if (weekIndex >= 0 && planData.weeks?.[weekIndex]) {
      currentWeek = planData.weeks[weekIndex];
    }
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: allWorkouts } = await supabase
    .from("workouts")
    .select("distance_meters, total_elevation_gain, max_speed")
    .eq("user_id", user.id);

  const totalDistanceKm = (allWorkouts ?? []).reduce((s, w) => s + (w.distance_meters ?? 0), 0) / 1000;
  const hasElevation = (allWorkouts ?? []).some((w) => (w.total_elevation_gain ?? 0) > 0);
  const maxSpeed = (allWorkouts ?? []).reduce((s, w) => Math.max(s, w.max_speed ?? 0), 0);
  const badges = computeBadges({
    totalWorkouts: allWorkouts?.length ?? 0,
    totalDistanceKm,
    hasHeartrate: false,
    hasElevation,
    maxSpeed: maxSpeed || null,
  });

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

              {currentWeek && (
                <div className="glass-card p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Plan d&apos;entraînement</h2>
                    <Link
                      href={`/plans/${latestPlan!.id}`}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Voir tout →
                    </Link>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-zinc-400" />
                    <p className="text-xs text-zinc-500">{currentWeek.theme}</p>
                    <span className="ml-auto text-[10px] text-zinc-400">Semaine {currentWeek.week}</span>
                  </div>
                  <div className="space-y-1">
                    {currentWeek.sessions?.slice(0, 7).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-12 font-medium text-zinc-500">{s.day}</span>
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-800">
                            {s.type}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">{s.description}</span>
                        </div>
                        <span className="text-zinc-400">{s.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {goals && goals.length > 0 && (
                <div className="glass-card p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Objectifs</h2>
                    <Link href="/goals" className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                      Voir tout →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {goals.slice(0, 2).map((g) => {
                      const pct = g.target_value && g.target_value > 0
                        ? Math.min(100, Math.round((g.current_value / g.target_value) * 100))
                        : 0;
                      return (
                        <div key={g.id}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{g.title}</span>
                            <span className="text-zinc-500">{pct}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="glass-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold">Badges</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {badges.filter((b) => b.unlocked).length > 0 ? (
                    badges.filter((b) => b.unlocked).map((b) => (
                      <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium dark:bg-zinc-800">
                        <span>{b.icon}</span>
                        {b.label}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400">Continue tes entraînements pour débloquer des badges.</p>
                  )}
                </div>
                {badges.filter((b) => !b.unlocked && b.progress).length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] text-zinc-400">En cours</p>
                    {badges.filter((b) => !b.unlocked && b.progress).slice(0, 3).map((b) => (
                      <div key={b.id}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500">{b.icon} {b.label}</span>
                          <span className="text-zinc-400">{Math.round(b.progress ?? 0)}%</span>
                        </div>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <div className="h-full rounded-full bg-zinc-400" style={{ width: `${b.progress ?? 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
