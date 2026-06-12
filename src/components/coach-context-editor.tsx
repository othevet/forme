"use client";

import { useEffect, useState } from "react";
import { Bot, Check, AlertCircle } from "lucide-react";

export function CoachContextEditor() {
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/profile/context")
      .then((r) => r.json())
      .then((d) => {
        setContext(d.context ?? "");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/profile/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  if (loading) return <div className="h-24" />;

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold">Contexte Coach IA</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {status === "saved" ? (
            <><Check className="h-3 w-3" /> Sauvegardé</>
          ) : status === "error" ? (
            <><AlertCircle className="h-3 w-3" /> Erreur</>
          ) : saving ? (
            "Sauvegarde..."
          ) : (
            "Sauvegarder"
          )}
        </button>
      </div>
      <p className="mb-3 text-xs text-zinc-400">
        Colle ici le résumé de tes conversations avec Gemini ou tout contexte que le coach IA doit connaître
        (allures, objectifs, contraintes, historique).
      </p>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        rows={12}
        className="w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
        placeholder="Colle ton contexte ici..."
      />
    </div>
  );
}
