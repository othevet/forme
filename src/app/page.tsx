import Link from "next/link";

export default function HomePage() {
  return (
    <main className="gradient-bg flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="glass-card p-10">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Forme</h1>
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
            Connecte ta montre, analyse tes séances, reçois des conseils IA.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
