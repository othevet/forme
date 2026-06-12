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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Missing from/to params" }, { status: 400 });
  }

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("start_date, distance_meters")
    .eq("user_id", user.id)
    .gte("start_date", from)
    .lte("start_date", to)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const days = new Map<string, { count: number; totalDistance: number }>();

  for (const w of workouts) {
    const dateKey = w.start_date?.split("T")[0];
    if (!dateKey) continue;
    const existing = days.get(dateKey) ?? { count: 0, totalDistance: 0 };
    existing.count++;
    existing.totalDistance += w.distance_meters ?? 0;
    days.set(dateKey, existing);
  }

  const result = Array.from(days.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    totalDistance: data.totalDistance,
  }));

  return NextResponse.json({ days: result });
}
