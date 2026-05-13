"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type StagesBarPoint = {
  label: string;
  count: number;
};

export function StagesBarChart({ data }: { data: StagesBarPoint[] }) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sem dados para exibir.
      </div>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            stroke="var(--color-muted-foreground)"
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-foreground)" }}
          />
          <Bar dataKey="count" fill="var(--color-foreground)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
