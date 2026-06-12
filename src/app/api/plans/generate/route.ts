import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { mistral } from "@/lib/ai/client";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, coaching_context")
    .eq("id", user.id)
    .single();

  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("start_date, sport_type, distance_meters, moving_time_seconds, average_heartrate, total_elevation_gain")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(10);

  const body = await request.json();
  const goal = body.goal || "Améliorer mon endurance";
  const weeks = body.weeks || 4;
  const sportType = body.sport_type || "Run";

  const workoutSummary = recentWorkouts?.length
    ? recentWorkouts.map((w) => `- ${w.sport_type} ${(w.distance_meters / 1000).toFixed(1)}km, ${Math.floor(w.moving_time_seconds / 60)}min${w.average_heartrate ? `, ${Math.round(w.average_heartrate)}bpm` : ""}${w.total_elevation_gain ? `, ${Math.round(w.total_elevation_gain)}m D+` : ""} le ${new Date(w.start_date).toLocaleDateString("fr-FR")}`).join("\n")
    : "Aucune séance récente.";

  const systemPrompt = `Tu es Forme Coach, un coach sportif IA expert en création de plans d'entraînement.
Génère un plan d'entraînement personnalisé en français.

Format de réponse : un JSON valide uniquement, sans texte autour, avec cette structure exacte :
{
  "title": "Titre du plan",
  "goal": "${goal}",
  "overview": "Description générale du plan (2-3 phrases)",
  "weeks": [
    {
      "week": 1,
      "theme": "Thème de la semaine",
      "description": "Description de la semaine",
      "sessions": [
        { "day": "Lundi", "type": "Repos", "description": "...", "duration": "..." },
        { "day": "Mardi", "type": "Fractionné", "description": "...", "duration": "..." }
      ]
    }
  ]
}

Semaines : ${weeks}. Sport : ${sportType}. Objectif : ${goal}.`;

  const userContent = `Contexte utilisateur :
Nom : ${profile?.display_name ?? "Sportif"}
Contexte coach : ${profile?.coaching_context ?? "Aucun"}
Dernières séances :
${workoutSummary}

Génère un plan d'entraînement de ${weeks} semaines pour ${sportType} avec l'objectif : ${goal}.`;

  try {
    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      responseFormat: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const planJson = JSON.parse(content);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: plan, error } = await supabaseAdmin
      .from("training_plans")
      .insert({
        user_id: user.id,
        title: planJson.title || `Plan ${sportType} - ${goal}`,
        goal,
        sport_type: sportType,
        duration_weeks: weeks,
        plan_json: planJson,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Generation failed" }, { status: 500 });
  }
}
