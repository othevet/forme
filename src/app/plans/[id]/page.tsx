import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Target, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/print-button";

interface WeekSession {
  day: string;
  type: string;
  description: string;
  duration: string;
}

interface PlanWeek {
  week: number;
  theme: string;
  description: string;
  sessions: WeekSession[];
}

interface PlanJSON {
  title: string;
  goal: string;
  overview: string;
  weeks: PlanWeek[];
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { id } = await params;

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!plan) notFound();

  const content = plan.plan_json as PlanJSON;

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href="/plans"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux plans
        </Link>

        <div className="glass-card mb-6 p-6">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-semibold">{content?.title ?? plan.title}</h1>
            <PrintButton />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              {plan.goal}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {plan.duration_weeks} semaines
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {plan.sport_type}
            </span>
          </div>
          {content?.overview && (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {content.overview}
            </p>
          )}
        </div>

        {content?.weeks?.map((week) => (
          <div key={week.week} className="glass-card mb-4 p-6">
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-xs font-medium text-orange-500">
                Semaine {week.week}
              </span>
              <h2 className="text-sm font-semibold">{week.theme}</h2>
            </div>
            {week.description && (
              <p className="mb-4 text-xs text-zinc-500">{week.description}</p>
            )}

            <div className="space-y-2">
              {week.sessions?.map((session, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2.5 text-sm dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs font-medium text-zinc-500">
                      {session.day}
                    </span>
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-800">
                      {session.type}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {session.description}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">{session.duration}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
