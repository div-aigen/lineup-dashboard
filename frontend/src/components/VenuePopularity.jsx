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
import { truncate } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {Array<{venue: string, sessions: number}>} props.data - Venue popularity ranked by session count.
 */
export default function VenuePopularity({ data }) {
  if (!data || data.length === 0) {
    return (
      <div data-testid="venue-popularity" className="glass-panel rounded-md p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
          Venue Popularity
        </h3>
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          No data yet
        </div>
      </div>
    );
  }

  // Shorten venue names for chart
  const chartData = data.map((d) => ({
    ...d,
    shortName: truncate(d.venue),
  }));

  return (
    <div data-testid="venue-popularity" className="glass-panel rounded-md p-6 animate-fade-in">
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
        Venue Popularity
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            allowDecimals={false}
          />
          <YAxis
            dataKey="shortName"
            type="category"
            width={110}
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(entry) => `${entry.value} sessions held`}
              />
            }
          />
          <Bar dataKey="sessions" fill="#D9F99D" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
