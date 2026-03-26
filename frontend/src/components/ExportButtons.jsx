import { useState, useRef, useEffect, useCallback } from "react";
import { useApi } from "@/App";
import { FileDown, ChevronDown } from "lucide-react";
import { exportApi, buildDateParams } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * @param {Object} props
 * @param {string|null} props.startDate - ISO date string for export range start.
 * @param {string|null} props.endDate - ISO date string for export range end.
 */
export default function ExportButtons({ startDate, endDate }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const api = useApi();
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  const exports = [
    { key: "users", label: "Users" },
    { key: "sessions", label: "Sessions" },
    { key: "participants", label: "Participants" },
  ];

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setFocusIndex(-1);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex].focus();
    }
  }, [open, focusIndex]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusIndex((prev) => Math.min(prev + 1, exports.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIndex((prev) => (prev <= 0 ? 0 : prev - 1));
        break;
      case "Tab":
        closeDropdown();
        break;
      default:
        break;
    }
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const client = api();
      const params = buildDateParams(startDate, endDate);
      await exportApi.downloadCsv(client, type, params);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
      closeDropdown();
    }
  };

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <Button
        ref={triggerRef}
        data-testid="export-btn"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(!open);
          if (!open) setFocusIndex(0);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Export data as CSV"
        className="bg-brand-surface border-slate-700 text-slate-300 hover:bg-brand-surface-hi hover:text-white rounded-sm"
      >
        <FileDown size={14} aria-hidden="true" />
        Export CSV
        <ChevronDown size={12} aria-hidden="true" />
      </Button>

      {open && (
        <div
          data-testid="export-dropdown"
          role="menu"
          aria-label="Export options"
          className="absolute right-0 top-full mt-2 glass-panel rounded-md border border-slate-700 shadow-xl overflow-hidden min-w-[180px]"
          style={{ zIndex: 100 }}
        >
          {exports.map((exp, i) => (
            <button
              key={exp.key}
              ref={(el) => (itemRefs.current[i] = el)}
              data-testid={`export-${exp.key}-btn`}
              role="menuitem"
              tabIndex={focusIndex === i ? 0 : -1}
              onClick={() => handleExport(exp.key)}
              disabled={exporting === exp.key}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white focus:bg-slate-800/50 focus:text-white focus:outline-none transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileDown size={14} className="text-slate-500" aria-hidden="true" />
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
      )}
    </div>
  );
}
