import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartTooltip from "@/components/ChartTooltip";
import { formatChartDate } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {Array<{date: string, sessions: number}>} props.data - Session count data points over time.
 */
function SessionsTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div data-testid="sessions-trend-chart" className="glass-panel rounded-md p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
          Sessions Over Time
        </h3>
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div data-testid="sessions-trend-chart" className="glass-panel rounded-md p-6 animate-fade-in">
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
        Sessions Over Time
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={formatChartDate}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            allowDecimals={false}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(entry) => `${entry.value} sessions`}
              />
            }
          />
          <Bar dataKey="sessions" fill="#22D3EE" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(SessionsTrendChart);
