import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-surface-hi border border-slate-700 rounded-md px-3 py-2 text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-brand-text font-medium">
        {payload[0].value} sessions held
      </p>
    </div>
  );
};

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
    shortName: d.venue.length > 15 ? d.venue.substring(0, 14) + "..." : d.venue,
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
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sessions" fill="#D9F99D" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
