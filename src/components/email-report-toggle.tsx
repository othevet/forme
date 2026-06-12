"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

interface Props {
  enabled: boolean;
  userEmail: string | undefined;
}

export function EmailReportToggle({ enabled, userEmail }: Props) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  async function toggle() {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    const res = await fetch("/api/profile/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_weekly_report: newValue, email: userEmail }),
    });

    if (!res.ok) {
      setIsEnabled(!newValue);
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(newValue ? "Rapport hebdo activé" : "Rapport hebdo désactivé");
    }
  }

  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 text-sm font-semibold">Rapport hebdomadaire</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-zinc-400" />
          <div>
            <p className="text-sm font-medium">Résumé par email</p>
            <p className="text-xs text-zinc-500">
              Reçois un résumé de ta semaine chaque lundi
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isEnabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              isEnabled ? "translate-x-[18px]" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
