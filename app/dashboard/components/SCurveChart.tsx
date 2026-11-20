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
} from "recharts";
import type { SCurveBuildResult } from "@/lib/preventive/sCurve";

type SCurveChartProps = {
  result: SCurveBuildResult;
  title: string;
  emptyMessage: string;
};

export default function SCurveChart({ result, title, emptyMessage }: SCurveChartProps) {
  if (!result.ok) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center">
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  const data = result.points.map((p) => ({
    ...p,
    label: p.date.slice(5),
  }));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="text-[10px] text-gray-500 font-mono">
          {result.minDate} → {result.maxDate}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip
              formatter={(value) => [value == null ? "—" : `${value}%`, ""]}
              labelFormatter={(label) => `Periodo: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="planned"
              name="Planificado"
              stroke="#0d9488"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Real"
              stroke="#f04438"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
