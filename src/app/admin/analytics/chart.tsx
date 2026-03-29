"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export type MetricRow = {
  date: string;
  [key: string]: string | number;
};

export function MetricLineChart({
  data,
  lines,
  title,
  yFormatter,
}: {
  data: MetricRow[];
  lines: { key: string; color: string; label: string }[];
  title: string;
  yFormatter?: (v: number) => string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={yFormatter} />
          <Tooltip formatter={(v, name) => {
            const line = lines.find((l) => l.key === name);
            const num = typeof v === "number" ? v : Number(v) || 0;
            const formatted = yFormatter ? yFormatter(num) : num;
            return [formatted, line?.label ?? String(name)];
          }} />
          <Legend formatter={(v) => lines.find((l) => l.key === v)?.label ?? v} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricBarChart({
  data,
  bars,
  title,
}: {
  data: MetricRow[];
  bars: { key: string; color: string; label: string }[];
  title: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v, name) => {
            const bar = bars.find((b) => b.key === name);
            return [v, bar?.label ?? String(name)];
          }} />
          <Legend formatter={(v) => bars.find((b) => b.key === v)?.label ?? v} />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
