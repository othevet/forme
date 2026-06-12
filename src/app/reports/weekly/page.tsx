import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";

export default async function WeeklyReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_date", oneWeekAgo.toISOString())
    .order("start_date", { ascending: false });

  if (!workouts || workouts.length === 0) notFound();

  const totalDistance = workouts.reduce((s, w) => s + (w.distance_meters ?? 0), 0);
  const totalDuration = workouts.reduce((s, w) => s + (w.moving_time_seconds ?? 0), 0);
  const totalElevation = workouts.reduce((s, w) => s + (w.total_elevation_gain ?? 0), 0);
  const avgHr = Math.round(workouts.reduce((s, w) => s + (w.average_heartrate ?? 0), 0) / workouts.length);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="no-print mb-4">
          <PrintButton label="Télécharger PDF" />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-white print:border print:bg-white">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-zinc-900">
              Rapport hebdomadaire
            </h1>
            <p className="text-sm text-zinc-500">
              {profile?.display_name ?? "Sportif"} · Semaine du {oneWeekAgo.toLocaleDateString("fr-FR")}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            {[
              { value: `${(totalDistance / 1000).toFixed(1)} km`, label: "Distance" },
              { value: formatTime(totalDuration), label: "Temps" },
              { value: `${workouts.length} séances`, label: "Fréquence" },
              { value: avgHr ? `${avgHr} bpm` : "-", label: "FC moyenne" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-zinc-50 p-4 text-center print:bg-zinc-50">
                <p className="text-xl font-bold text-zinc-900">{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="pb-2 text-left font-medium text-zinc-500">Nom</th>
                <th className="pb-2 text-right font-medium text-zinc-500">Type</th>
                <th className="pb-2 text-right font-medium text-zinc-500">Distance</th>
                <th className="pb-2 text-right font-medium text-zinc-500">Durée</th>
                <th className="pb-2 text-right font-medium text-zinc-500">FC</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w.id} className="border-b border-zinc-100">
                  <td className="py-2 text-zinc-900">{w.name ?? "Séance"}</td>
                  <td className="py-2 text-right text-zinc-500">{w.sport_type}</td>
                  <td className="py-2 text-right text-zinc-900">{w.distance_meters ? `${(w.distance_meters / 1000).toFixed(1)} km` : "-"}</td>
                  <td className="py-2 text-right text-zinc-900">{w.moving_time_seconds ? formatTime(w.moving_time_seconds) : "-"}</td>
                  <td className="py-2 text-right text-zinc-900">{w.average_heartrate ? `${Math.round(w.average_heartrate)} bpm` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-8 text-center text-[10px] text-zinc-400">
            Généré par Forme le {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    </main>
  );
}
