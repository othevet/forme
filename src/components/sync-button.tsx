"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

export function SyncButton({ userId }: { userId: string }) {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");

  const handleSync = async () => {
    setSyncing(true);
    setStatus("syncing");
    try {
      const res = await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setStatus("done");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
    >
      {status === "syncing" ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : status === "done" ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : status === "error" ? (
        <AlertCircle className="h-3 w-3 text-red-500" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      {status === "syncing" ? "Sync..." : status === "done" ? "Synchronisé" : status === "error" ? "Erreur" : "Sync Strava"}
    </button>
  );
}
