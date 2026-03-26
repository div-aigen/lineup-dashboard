/**
 * Shared chart tooltip component for Recharts. Styled to match the brand dark theme.
 * @param {Object} props - Recharts tooltip props, injected automatically.
 * @param {boolean} props.active - Whether the tooltip is active.
 * @param {Array} props.payload - Data entries for the hovered point.
 * @param {string} [props.label] - X-axis label for the hovered point.
 * @param {(entry: Object) => string} [props.formatter] - Custom formatter for each payload entry.
 */
export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-md px-3 py-2 text-sm border border-slate-700 shadow-lg"
      style={{ backgroundColor: "#1E293B" }}
    >
      {label && (
        <p className="text-xs mb-1" style={{ color: "#94A3B8" }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || "#F8FAFC" }} className="font-medium">
          {formatter ? formatter(entry) : `${entry.value} ${entry.name || ""}`}
        </p>
      ))}
    </div>
  );
}
