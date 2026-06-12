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

  const { searchParams } = new URL(request.url);
  const id1 = searchParams.get("id1");
  const id2 = searchParams.get("id2");

  if (!id1 || !id2) {
    return NextResponse.json({ error: "Missing id1 or id2" }, { status: 400 });
  }

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("id, name, sport_type, distance_meters, moving_time_seconds, elapsed_time_seconds, average_heartrate, max_heartrate, average_speed, max_speed, total_elevation_gain, average_cadence, average_watts, max_watts, calories, start_date")
    .eq("user_id", user.id)
    .in("id", [parseInt(id1), parseInt(id2)]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: splits } = await supabase
    .from("workout_splits")
    .select("*")
    .in("workout_id", [parseInt(id1), parseInt(id2)])
    .order("split", { ascending: true });

  const splitsByWorkout = new Map<number, typeof splits>();
  for (const s of splits ?? []) {
    const existing = splitsByWorkout.get(s.workout_id) ?? [];
    existing.push(s);
    splitsByWorkout.set(s.workout_id, existing);
  }

  const w1 = workouts?.find((w) => w.id === parseInt(id1));
  const w2 = workouts?.find((w) => w.id === parseInt(id2));

  return NextResponse.json({
    workout1: w1 ?? null,
    workout2: w2 ?? null,
    splits1: splitsByWorkout.get(parseInt(id1)) ?? [],
    splits2: splitsByWorkout.get(parseInt(id2)) ?? [],
  });
}
