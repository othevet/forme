"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");

      if (!code) {
        setError("Code d'autorisation manquant");
        return;
      }

      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const tokenRes = await fetch("/api/strava/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        setError(`Erreur d'authentification Strava: ${text}`);
        return;
      }

      const tokenData = await tokenRes.json();

      const { error: dbError } = await supabase.from("strava_connections").upsert({
        user_id: user.id,
        strava_athlete_id: tokenData.athlete?.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      });

      if (dbError) {
        setError(`Erreur de sauvegarde: ${dbError.message}`);
        return;
      }

      if (tokenData.athlete?.firstname || tokenData.athlete?.lastname) {
        const displayName = `${tokenData.athlete.firstname ?? ""} ${tokenData.athlete.lastname ?? ""}`.trim();
        await supabase.from("profiles").upsert({ id: user.id, display_name: displayName });
      }

      await fetch("/api/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      router.push("/dashboard?strava=connected");
    };

    processCallback();
  }, []);

  return (
    <main className="gradient-bg flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="glass-card p-8 text-center">
        {error ? (
          <>
            <p className="mb-4 text-sm text-red-500">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Retour au tableau de bord
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">Connexion Strava en cours...</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense fallback={
      <main className="gradient-bg flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">Connexion Strava en cours...</p>
          </div>
        </div>
      </main>
    }>
      <CallbackContent />
    </Suspense>
  );
}
