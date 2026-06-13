import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getGenAI, CHAT_MODEL, COACH_SYSTEM_PROMPT } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
  const { message, sessionId } = await request.json();

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
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("name, sport_type, distance_meters, moving_time_seconds, start_date, average_heartrate, average_speed, total_elevation_gain, calories")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(10);

  const workoutContext = recentWorkouts && recentWorkouts.length > 0
    ? `Séances récentes de l'utilisateur (des 10 dernières, depuis la plus récente):\n${recentWorkouts.map((w) =>
        `- ${new Date(w.start_date).toLocaleDateString("fr-FR")}: ${w.name ?? "Séance"} (${w.sport_type}), ${w.distance_meters ? `${(w.distance_meters / 1000).toFixed(1)}km` : ""}, ${w.moving_time_seconds ? `${Math.floor(w.moving_time_seconds / 60)}min` : ""}${w.average_heartrate ? `, FC ${Math.round(w.average_heartrate)}bpm` : ""}${w.total_elevation_gain ? `, D+${Math.round(w.total_elevation_gain)}m` : ""}`
      ).join("\n")}`
    : "Aucune séance récente.";

  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const { data: newSession } = await supabase
      .from("coaching_sessions")
      .insert({ user_id: user.id, title: "Session de coaching" })
      .select("id")
      .single();
    currentSessionId = newSession?.id;
  }

  if (currentSessionId) {
    await supabase.from("coaching_messages").insert({
      session_id: currentSessionId,
      role: "user",
      content: message,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("coaching_context")
    .eq("id", user.id)
    .single();

  const contextSection = profile?.coaching_context
    ? `\n\nContexte historique des conversations avec l'utilisateur (à prendre en compte pour la continuité du coaching):\n${profile.coaching_context}`
    : "";

  const systemContent = `${COACH_SYSTEM_PROMPT}\n\n${workoutContext}${contextSection}`;

  const { data: history } = await supabase
    .from("coaching_messages")
    .select("role, content")
    .eq("session_id", currentSessionId)
    .order("created_at", { ascending: true });

  const model = getGenAI().getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: systemContent,
  });

  const contents = (history ?? []).map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContentStream({ contents });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();

      if (currentSessionId && fullResponse) {
        await supabase.from("coaching_messages").insert({
          session_id: currentSessionId,
          role: "assistant",
          content: fullResponse,
        });
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Session-Id": currentSessionId ?? "",
    },
  });
}
