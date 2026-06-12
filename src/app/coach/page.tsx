"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Send, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasWorkouts, setHasWorkouts] = useState(true);
  const [workoutSummary, setWorkoutSummary] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.from("workouts").select("id", { count: "exact", head: true }).limit(1).then(({ count }) => {
      setHasWorkouts((count ?? 0) > 0);
    });

    supabase.from("workouts").select("sport_type, count").then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach((w) => { counts[w.sport_type] = (counts[w.sport_type] ?? 0) + 1; });
      setWorkoutSummary(Object.entries(counts).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(" · "));
    });

    // Load most recent session
    supabase
      .from("coaching_sessions")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data: session }) => {
        if (!session) return;
        setSessionId(session.id);
        supabase
          .from("coaching_messages")
          .select("id, role, content")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true })
          .then(({ data: msgs }) => {
            if (msgs && msgs.length > 0) {
              setMessages(msgs.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
            }
          });
      });
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!res.ok) throw new Error("Failed");

      const newSessionId = res.headers.get("X-Session-Id");
      if (newSessionId) setSessionId(newSessionId);

      const reader = res.body?.getReader();
      if (!reader) return;

      const msgId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: "" }]);

      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        fullText += chunk;
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: fullText } : m)));
      }
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Désolé, une erreur est survenue. Réessaie." }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <main className="gradient-bg flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h1 className="text-base font-semibold">Coach IA</h1>
          </div>
          {workoutSummary && (
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" />{workoutSummary}</span>
            </div>
          )}
        </div>

        {!hasWorkouts && (
          <div className="glass-card mb-4 p-4 text-center text-sm text-zinc-500">
            Connecte d&apos;abord Strava et synchronise des séances pour utiliser le coach.
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="glass-card p-6 text-center">
              <Bot className="mx-auto mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="mb-1 text-sm font-medium">Pose une question sur tes entraînements</p>
              <p className="text-xs text-zinc-400">
                Ex: &quot;Analyse ma dernière semaine&quot; · &quot;Que penser de ma séance d&apos;hier ?&quot; · &quot;Conseils pour progresser en course&quot;
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "glass-card"
                }`}
              >
                {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || "..."}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>

        <div className="sticky bottom-0 border-t border-zinc-200 bg-white/80 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={streaming ? "Le coach réfléchit..." : "Pose une question à ton coach..."}
              disabled={streaming}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
