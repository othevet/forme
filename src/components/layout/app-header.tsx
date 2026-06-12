"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Dumbbell, Bot, Settings, BarChart3,
  LogIn, UserPlus, Activity, Shield, Calendar, Target,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Séances", href: "/workouts", icon: Activity },
  { label: "Stats", href: "/stats", icon: BarChart3 },
  { label: "Coach", href: "/coach", icon: Bot },
  { label: "Objectifs", href: "/goals", icon: Target },
  { label: "Plans", href: "/plans", icon: Calendar },
  { label: "Réglages", href: "/settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string; id: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [initial, setInitial] = useState(true);
  const initials = useRef("?");
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        supabase
          .from("profiles")
          .select("display_name, role")
          .eq("id", u.id)
          .single()
          .then(({ data: p }) => {
            initials.current = p?.display_name?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? "?";
            if (p?.role) setRole(p.role);
          });
      }
      setInitial(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isAuthPage = pathname.startsWith("/auth/") || pathname.startsWith("/strava/");

  if (initial) {
    return (
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Dumbbell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            <span className="text-lg font-semibold tracking-tight">Forme</span>
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href={user ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2">
          <Dumbbell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          <span className="text-lg font-semibold tracking-tight">Forme</span>
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {user
            ? [...NAV_ITEMS, ...(role === "admin" ? [{ label: "Admin", href: "/admin", icon: Shield }] : [])].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3",
                      active
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })
            : !isAuthPage && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>S&apos;inscrire</span>
                  </Link>
                </div>
              )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {user && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {initials.current}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
