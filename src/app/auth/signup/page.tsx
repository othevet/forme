"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="gradient-bg flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="glass-card p-6">
          <h1 className="mb-6 text-xl font-semibold">Créer un compte</h1>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
              required
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              S&apos;inscrire
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-zinc-500">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="text-zinc-700 underline dark:text-zinc-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
