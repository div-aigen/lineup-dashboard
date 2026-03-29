import { memo } from "react";
import {
  AreaChart,
  Area,
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
 * @param {Array<{date: string, users: number, new_users: number}>} props.data - User growth data points over time.
 */
function UserGrowthChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div data-testid="user-growth-chart" className="glass-panel rounded-md p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
          User Growth
        </h3>
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div data-testid="user-growth-chart" className="glass-panel rounded-md p-6 animate-fade-in">
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
        User Growth
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
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
                formatter={(entry) =>
                  entry.dataKey === "new_users"
                    ? `+${entry.value} new`
                    : `${entry.value} total users`
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#userGrad)"
          />
          <Area
            type="monotone"
            dataKey="new_users"
            stroke="#D9F99D"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(UserGrowthChart);
