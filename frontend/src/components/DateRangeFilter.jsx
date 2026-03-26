import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, X } from "lucide-react";

const PRESETS = [
  { label: "Today", getDates: () => { const t = new Date().toISOString().split("T")[0]; return [t, t]; } },
  { label: "Last 7 Days", getDates: () => { const e = new Date(); const s = new Date(e); s.setDate(s.getDate() - 7); return [s.toISOString().split("T")[0], e.toISOString().split("T")[0]]; } },
  { label: "Last 30 Days", getDates: () => { const e = new Date(); const s = new Date(e); s.setDate(s.getDate() - 30); return [s.toISOString().split("T")[0], e.toISOString().split("T")[0]]; } },
  { label: "This Month", getDates: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth(), 1); return [s.toISOString().split("T")[0], n.toISOString().split("T")[0]]; } },
  { label: "All Time", getDates: () => [null, null] },
];

/**
 * @param {Object} props
 * @param {string|null} props.startDate - ISO date string for range start, or null for no filter.
 * @param {string|null} props.endDate - ISO date string for range end, or null for no filter.
 * @param {(startDate: string|null, endDate: string|null) => void} props.onChange - Called when the date range changes.
 */
export default function DateRangeFilter({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(startDate || "");
  const [localEnd, setLocalEnd] = useState(endDate || "");
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const hasFilter = startDate || endDate;

  const activeLabel = hasFilter
    ? PRESETS.find((p) => {
        const [s, e] = p.getDates();
        return s === startDate && e === endDate;
      })?.label || "Custom"
    : "All Time";

  const closeDropdown = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && panelRef.current) {
      const firstButton = panelRef.current.querySelector("button");
      if (firstButton) firstButton.focus();
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeDropdown();
    }
  };

  const applyDates = (s, e) => {
    setLocalStart(s || "");
    setLocalEnd(e || "");
    onChange(s, e);
    setOpen(false);
  };

  const clearFilter = () => {
    setLocalStart("");
    setLocalEnd("");
    onChange(null, null);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        data-testid="date-filter-btn"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Date filter: ${activeLabel}`}
        className={`inline-flex items-center gap-2 text-sm rounded-sm px-3 py-2 border transition-colors ${
          hasFilter
            ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
            : "bg-brand-surface border-slate-700 text-slate-300 hover:bg-brand-surface-hi hover:text-white"
        }`}
      >
        <Calendar size={14} aria-hidden="true" />
        <span>{activeLabel}</span>
        {hasFilter && (
          <X
            size={14}
            role="button"
            aria-label="Clear date filter"
            tabIndex={0}
            className="ml-1 hover:text-white cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              clearFilter();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                clearFilter();
              }
            }}
          />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          data-testid="date-filter-dropdown"
          role="dialog"
          aria-label="Select date range"
          className="absolute right-0 top-full mt-2 glass-panel rounded-md p-4 w-80 border border-slate-700 shadow-xl"
          style={{ zIndex: 100 }}
        >
          {/* Presets */}
          <div className="mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2" id="preset-label">
              Quick Select
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="preset-label">
              {PRESETS.map((preset) => {
                const [s, e] = preset.getDates();
                const isActive = s === startDate && e === endDate;
                return (
                  <button
                    key={preset.label}
                    data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => applyDates(s, e)}
                    aria-pressed={isActive}
                    className={`text-xs px-2.5 py-1.5 rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary ${
                      isActive
                        ? "bg-brand-primary text-brand-primary-fg font-bold"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom range */}
          <div className="border-t border-slate-800 pt-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Custom Range
            </p>
            <div className="flex gap-2 items-center">
              <input
                data-testid="date-start-input"
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                aria-label="Start date"
                className="flex-1 bg-brand-surface border border-slate-700 rounded-sm px-2 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-primary/50"
              />
              <span className="text-slate-600 text-xs" aria-hidden="true">to</span>
              <input
                data-testid="date-end-input"
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                aria-label="End date"
                className="flex-1 bg-brand-surface border border-slate-700 rounded-sm px-2 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-primary/50"
              />
            </div>
            <button
              data-testid="apply-custom-date-btn"
              onClick={() => applyDates(localStart || null, localEnd || null)}
              className="mt-2 w-full bg-brand-primary text-brand-primary-fg font-bold uppercase tracking-wide rounded-sm py-1.5 text-xs hover:bg-brand-primary/90 transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary focus:ring-offset-1 focus:ring-offset-brand-bg"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
