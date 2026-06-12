"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface WeekData {
  name: string;
  km: number;
}

export function WeeklyChart({ data }: { data: WeekData[] }) {
  if (data.length === 0) {
    return <p className="py-4 text-center text-xs text-zinc-400">Aucune donnée</p>;
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              background: "rgba(255,255,255,0.95)",
            }}
          />
          <Bar dataKey="km" fill="#18181b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
