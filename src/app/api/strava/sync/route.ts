import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function refreshStravaToken(refreshToken: string, userId: string) {
  const clientId = process.env.STRAVA_CLIENT_ID!;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET!;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error("Token refresh failed");

  const data = await res.json();
  await supabaseAdmin
    .from("strava_connections")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId);

  return data.access_token;
}

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  // Verify the caller is the same user
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
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: conn } = await supabaseAdmin
    .from("strava_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!conn) {
    return NextResponse.json({ error: "No Strava connection" }, { status: 400 });
  }

  let accessToken = conn.access_token;

  // Check if token expired
  if (new Date(conn.expires_at) < new Date()) {
    accessToken = await refreshStravaToken(conn.refresh_token, userId);
  }

  // Fetch activities from Strava
  const activitiesRes = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=30",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!activitiesRes.ok) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }

  const activities = await activitiesRes.json();

  // Upsert into DB
  for (const act of activities) {
    const workout = {
      id: act.id,
      user_id: userId,
      strava_connection_id: conn.id,
      name: act.name,
      sport_type: act.sport_type ?? act.type,
      workout_type: act.workout_type?.toString(),
      description: act.description,
      distance_meters: act.distance,
      moving_time_seconds: act.moving_time,
      elapsed_time_seconds: act.elapsed_time,
      total_elevation_gain: act.total_elevation_gain,
      average_speed: act.average_speed,
      max_speed: act.max_speed,
      average_heartrate: act.average_heartrate,
      max_heartrate: act.max_heartrate,
      average_cadence: act.average_cadence,
      average_watts: act.average_watts,
      max_watts: act.max_watts,
      kilojoules: act.kilojoules,
      calories: act.calories,
      start_date: act.start_date,
      timezone: act.timezone,
      polyline: act.map?.polyline,
      map_summary_polyline: act.map?.summary_polyline,
      device_name: act.device_name,
      gear_id: act.gear?.id,
      trainer: act.trainer,
      commute: act.commute,
      flagged: act.flagged,
    };

    await supabaseAdmin.from("workouts").upsert(workout, { onConflict: "id" });

    // Fetch detailed activity (includes splits)
    const detailRes = await fetch(
      `https://www.strava.com/api/v3/activities/${act.id}?include_all_efforts=false`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (detailRes.ok) {
      const detail = await detailRes.json();
      const splits = detail.splits_metric ?? [];
      if (splits.length > 0) {
        // Delete old splits for this workout
        await supabaseAdmin.from("workout_splits").delete().eq("workout_id", act.id);

        // Insert new splits
        const splitRows = splits.map((s: any, i: number) => ({
          workout_id: act.id,
          split: s.split ?? i + 1,
          distance_meters: s.distance,
          moving_time_seconds: s.moving_time,
          elapsed_time_seconds: s.elapsed_time,
          average_speed: s.average_speed,
          average_heartrate: s.average_heartrate,
          elevation_difference: s.elevation_difference,
          pace_seconds: s.moving_time && s.distance ? s.moving_time / (s.distance / 1000) : null,
        }));
        await supabaseAdmin.from("workout_splits").insert(splitRows);
      }
    }
  }

  return NextResponse.json({ synced: activities.length });
}
