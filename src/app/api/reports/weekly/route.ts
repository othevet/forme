import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const cookieStore = request.cookies;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, email_weekly_report")
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

  const totalDistance = (workouts ?? []).reduce((s, w) => s + (w.distance_meters ?? 0), 0);
  const totalDuration = (workouts ?? []).reduce((s, w) => s + (w.moving_time_seconds ?? 0), 0);
  const totalElevation = (workouts ?? []).reduce((s, w) => s + (w.total_elevation_gain ?? 0), 0);
  const avgHeartrate = workouts && workouts.length > 0
    ? Math.round(workouts.reduce((s, w) => s + (w.average_heartrate ?? 0), 0) / workouts.length)
    : 0;

  const bySport: Record<string, { count: number; distance: number }> = {};
  for (const w of workouts ?? []) {
    const sport = w.sport_type ?? "Autre";
    if (!bySport[sport]) bySport[sport] = { count: 0, distance: 0 };
    bySport[sport].count++;
    bySport[sport].distance += w.distance_meters ?? 0;
  }

  const report = {
    week: {
      from: oneWeekAgo.toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    athlete: profile?.display_name ?? "Sportif",
    summary: {
      totalWorkouts: workouts?.length ?? 0,
      totalDistance: Math.round(totalDistance),
      totalDuration,
      totalElevation: Math.round(totalElevation),
      avgHeartrate,
    },
    bySport: Object.entries(bySport).map(([sport, data]) => ({
      sport,
      count: data.count,
      distance: Math.round(data.distance),
    })),
    workouts: (workouts ?? []).map((w) => ({
      name: w.name,
      sport_type: w.sport_type,
      distance: w.distance_meters ? Math.round(w.distance_meters) : 0,
      duration: w.moving_time_seconds ?? 0,
      heartrate: w.average_heartrate ? Math.round(w.average_heartrate) : null,
      date: w.start_date,
    })),
  };

  if (profile?.email && profile?.email_weekly_report) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const html = generateHtml(report);
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Forme <report@forme.app>",
            to: profile.email,
            subject: `Résumé hebdo - ${report.week.from}`,
            html,
          }),
        });
      } catch {
        // Email failed silently
      }
    }
  }

  return NextResponse.json({ report });
}

function generateHtml(report: { week: { from: string; to: string }; athlete: string; summary: { totalWorkouts: number; totalDistance: number; totalDuration: number; totalElevation: number; avgHeartrate: number }; bySport: { sport: string; count: number; distance: number }[]; workouts: { name: string | null; sport_type: string | null; distance: number; duration: number; heartrate: number | null; date: string | null }[] }) {
  const durationStr = `${Math.floor(report.summary.totalDuration / 3600)}h ${Math.floor((report.summary.totalDuration % 3600) / 60)}min`;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0">Résumé hebdomadaire</h1>
      <p style="color:#666;margin:4px 0 24px">${report.athlete} · ${report.week.from} → ${report.week.to}</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px">
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center">
          <p style="font-size:28px;font-weight:700;margin:0">${(report.summary.totalDistance / 1000).toFixed(1)}</p>
          <p style="color:#666;font-size:12px;margin:4px 0 0">km parcourus</p>
        </div>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center">
          <p style="font-size:28px;font-weight:700;margin:0">${report.summary.totalWorkouts}</p>
          <p style="color:#666;font-size:12px;margin:4px 0 0">séances</p>
        </div>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center">
          <p style="font-size:28px;font-weight:700;margin:0">${durationStr}</p>
          <p style="color:#666;font-size:12px;margin:4px 0 0">durée totale</p>
        </div>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center">
          <p style="font-size:28px;font-weight:700;margin:0">${report.summary.avgHeartrate}</p>
          <p style="color:#666;font-size:12px;margin:4px 0 0">bpm moyen</p>
        </div>
      </div>
      <p style="color:#888;font-size:11px">Généré par Forme · ${new Date().toLocaleDateString("fr-FR")}</p>
    </div>
  `;
}
