"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonthlyPoint = { label: string; opened: number; closed: number };

export default function MonthlyChartClient({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -20 }} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#78716c"
            tick={{ fontSize: 12, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            stroke="#78716c"
            tick={{ fontSize: 12, fill: "#78716c" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "#0f766e", opacity: 0.06 }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e7e5e4",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            labelStyle={{ color: "#0c0a09", fontWeight: 600 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#57534e" }}
          />
          <Bar dataKey="opened" name="Abertos" fill="#0f766e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="closed" name="Finalizados" fill="#d6d3d1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
