import { useState } from "react";
import { useApi } from "@/App";
import { FileDown, ChevronDown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ExportButtons({ startDate, endDate }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const api = useApi();

  const buildUrl = (path) => {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    const qs = params.toString();
    return `${BACKEND_URL}/api${path}${qs ? "?" + qs : ""}`;
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const client = api();
      const path = `/export/${type}-csv`;
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await client.get(path, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_export.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const exports = [
    { key: "users", label: "Users" },
    { key: "sessions", label: "Sessions" },
    { key: "participants", label: "Participants" },
  ];

  return (
    <div className="relative" style={{ zIndex: open ? 70 : "auto" }}>
      <button
        data-testid="export-btn"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 bg-brand-surface border border-slate-700 rounded-sm px-3 py-2 text-slate-300 hover:bg-brand-surface-hi hover:text-white transition-colors text-sm"
      >
        <FileDown size={14} />
        Export CSV
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 60 }} onClick={() => setOpen(false)} />
          <div
            data-testid="export-dropdown"
            className="absolute right-0 top-full mt-2 glass-panel rounded-md border border-slate-700 shadow-xl overflow-hidden min-w-[180px]"
            style={{ zIndex: 71 }}
          >
            {exports.map((exp) => (
              <button
                key={exp.key}
                data-testid={`export-${exp.key}-btn`}
                onClick={() => handleExport(exp.key)}
                disabled={exporting === exp.key}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FileDown size={14} className="text-slate-500" />
                {exporting === exp.key ? "Exporting..." : `${exp.label} Data`}
              </button>
            ))}
            {(startDate || endDate) && (
              <div className="border-t border-slate-800 px-4 py-2">
                <p className="text-[10px] text-slate-600">
                  Filtered: {startDate || "Start"} → {endDate || "End"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
