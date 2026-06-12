import { createClient } from "@/lib/supabase/server";
import { CoachContextEditor } from "@/components/coach-context-editor";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: strava } = await supabase
    .from("strava_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="gradient-bg min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h1 className="text-lg font-semibold">Réglages</h1>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 text-sm font-semibold">Profil</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Nom d&apos;affichage</p>
                <p className="text-sm">{profile?.display_name ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 text-sm font-semibold">Connexions</h2>
            {strava ? (
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" fill="#FC4C02" className="h-5 w-5">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.526l-4.116 8.28-2.762-6.256h2.762l2.116 3.877 2.45-4.9z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">Strava</p>
                    <p className="text-xs text-zinc-500">Connecté</p>
                  </div>
                </div>
              </div>
            ) : (
              <a
                href="/api/strava/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.526l-4.116 8.28-2.762-6.256h2.762l2.116 3.877 2.45-4.9z" />
                </svg>
                Connecter Strava
              </a>
            )}
          </div>

          <CoachContextEditor />
        </div>
      </div>
    </main>
  );
}
