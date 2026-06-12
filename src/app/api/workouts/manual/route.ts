import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
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

  const body = await request.json();

  const id = -Date.now();

  const { data: strava } = await supabase
    .from("strava_connections")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase.from("workouts").insert({
    id,
    user_id: user.id,
    strava_connection_id: strava?.id ?? null,
    name: body.name || "Séance manuelle",
    sport_type: body.sport_type || "Run",
    description: body.description || null,
    distance_meters: body.distance_meters ? parseFloat(body.distance_meters) : null,
    moving_time_seconds: body.moving_time_seconds ? parseInt(body.moving_time_seconds) : null,
    start_date: body.start_date || new Date().toISOString(),
    average_heartrate: body.average_heartrate ? parseFloat(body.average_heartrate) : null,
    total_elevation_gain: body.total_elevation_gain ? parseFloat(body.total_elevation_gain) : null,
    average_speed: body.average_speed ? parseFloat(body.average_speed) : null,
    calories: body.calories ? parseFloat(body.calories) : null,
    is_manual: true,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workout: data });
}
