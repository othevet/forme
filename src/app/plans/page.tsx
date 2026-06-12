import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: plans } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-xl font-semibold">Plans d&apos;entraînement</h1>
          </div>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau plan
          </Link>
        </div>

        {plans && plans.length > 0 ? (
          <div className="space-y-3">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                className="glass-card block rounded-lg p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <h3 className="font-medium">{p.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {p.sport_type} · {p.duration_weeks} semaines · {p.goal}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400">
                  Créé le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-lg p-8 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500">
              Aucun plan d&apos;entraînement pour le moment.
            </p>
            <Link
              href="/plans/new"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Créer ton premier plan →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
