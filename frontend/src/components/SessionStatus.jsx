import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ChartTooltip from "@/components/ChartTooltip";
import { toPercent } from "@/lib/utils";

const STATUS_COLORS = {
  open: "#22C55E",
  completed: "#3B82F6",
  cancelled: "#EF4444",
  full: "#F59E0B",
};

/**
 * @param {Object} props
 * @param {Array<{status: string, count: number}>} props.data - Session status distribution (open, completed, cancelled, full).
 */
export default function SessionStatus({ data }) {
  if (!data || data.length === 0) {
    return (
      <div data-testid="session-status" className="glass-panel rounded-md p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
          Session Status
        </h3>
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          No data yet
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div data-testid="session-status" className="glass-panel rounded-md p-6 animate-fade-in">
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
        Session Status
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] || "#64748B"}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                formatter={(entry) => `${entry.name}: ${entry.value}`}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] || "#64748B" }}
            />
            <span className="text-xs text-slate-400 capitalize">
              {item.status} ({toPercent(item.count, total)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
