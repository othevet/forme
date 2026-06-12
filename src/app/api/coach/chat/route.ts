import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { mistral, COACH_SYSTEM_PROMPT } from "@/lib/ai/client";

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

  // Get recent workouts for context
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

  // Get or create coaching session
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const { data: newSession } = await supabase
      .from("coaching_sessions")
      .insert({ user_id: user.id, title: "Session de coaching" })
      .select("id")
      .single();
    currentSessionId = newSession?.id;
  }

  // Save user message
  if (currentSessionId) {
    await supabase.from("coaching_messages").insert({
      session_id: currentSessionId,
      role: "user",
      content: message,
    });
  }

  // Get conversation history
  const { data: history } = await supabase
    .from("coaching_messages")
    .select("role, content")
    .eq("session_id", currentSessionId)
    .order("created_at", { ascending: true });

  const formattedHistory = history?.map((m) => ({ role: m.role, content: m.content })) ?? [];

  // Get coaching context from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("coaching_context")
    .eq("id", user.id)
    .single();

  const contextSection = profile?.coaching_context
    ? `\n\nContexte historique des conversations avec l'utilisateur (à prendre en compte pour la continuité du coaching):\n${profile.coaching_context}`
    : "";

  // Build messages for Mistral
  const messages = [
    { role: "system", content: `${COACH_SYSTEM_PROMPT}\n\n${workoutContext}${contextSection}` },
    ...formattedHistory,
  ];

  // Stream response
  const stream = await mistral.chat.stream({
    model: "mistral-small-latest",
    messages: messages as any,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.data?.choices?.[0]?.delta?.content;
        if (typeof content === "string") {
          fullResponse += content;
          controller.enqueue(encoder.encode(content));
        }
      }
      controller.close();

      // Save assistant message
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
