import { useState } from "react";
import { useApi } from "@/App";
import { Download, Smartphone, Apple, Plus } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { formatDateTime, formatShortDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * @param {Object} props
 * @param {Object} props.data - Downloads data with total, android, ios counts, last_updated, and history.
 * @param {() => void} props.onUpdate - Callback to refresh dashboard data after a download count update.
 */
export default function DownloadsWidget({ data, onUpdate }) {
  const api = useApi();
  const [editing, setEditing] = useState(false);
  const [platform, setPlatform] = useState("android");
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!count || isNaN(Number(count))) return;
    setSaving(true);
    try {
      const client = api();
      await settingsApi.updateDownloads(client, {
        count: Number(count),
        platform,
        note,
      });
      setEditing(false);
      setCount("");
      setNote("");
      onUpdate();
    } catch (err) {
      console.error("Failed to update downloads", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="downloads-widget" className="glass-panel rounded-md p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text">
          Downloads Tracker
        </h3>
        <button
          data-testid="edit-downloads-btn"
          onClick={() => setEditing(!editing)}
          aria-expanded={editing}
          aria-label="Update download counts"
          className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors uppercase tracking-wider font-medium"
        >
          <Plus size={14} aria-hidden="true" />
          Update
        </button>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-brand-surface rounded-sm p-4 text-center border border-slate-800">
          <Download size={18} className="mx-auto mb-2 text-brand-primary" />
          <p className="font-heading text-3xl font-bold text-brand-text animate-pulse-glow inline-block">
            {data?.total || 0}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            Total
          </p>
        </div>
        <div className="bg-brand-surface rounded-sm p-4 text-center border border-slate-800">
          <Smartphone size={18} className="mx-auto mb-2 text-brand-success" />
          <p className="font-heading text-3xl font-bold text-brand-text">
            {data?.android || 0}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            Android
          </p>
        </div>
        <div className="bg-brand-surface rounded-sm p-4 text-center border border-slate-800">
          <Apple size={18} className="mx-auto mb-2 text-slate-400" />
          <p className="font-heading text-3xl font-bold text-brand-text">
            {data?.ios || 0}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            iOS
          </p>
        </div>
      </div>

      {data?.last_updated && (
        <p className="text-[10px] text-slate-600 mb-3">
          Last updated: {formatDateTime(data.last_updated)}
        </p>
      )}

      {/* Edit form */}
      {editing && (
        <div
          data-testid="downloads-edit-form"
          className="border-t border-slate-800 pt-4 mt-2 space-y-3"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Platform
              </label>
              <select
                data-testid="downloads-platform-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-brand-surface border border-slate-700 rounded-sm px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Count
              </label>
              <Input
                data-testid="downloads-count-input"
                type="number"
                min="0"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="e.g. 150"
                className="bg-brand-surface border-slate-700 text-brand-text placeholder:text-slate-600 focus-visible:ring-brand-primary/50 rounded-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
              Note (optional)
            </label>
            <Input
              data-testid="downloads-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Play Console report"
              className="bg-brand-surface border-slate-700 text-brand-text placeholder:text-slate-600 focus-visible:ring-brand-primary/50 rounded-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              data-testid="save-downloads-btn"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-primary text-brand-primary-fg font-bold uppercase tracking-wide rounded-sm hover:bg-brand-primary/90"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              data-testid="cancel-downloads-btn"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
              className="bg-slate-800 text-slate-300 border-slate-700 rounded-sm hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {data?.history && data.history.length > 0 && (
        <div className="border-t border-slate-800 pt-3 mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            Update History
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {[...data.history].reverse().slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-slate-500">
                <span className="capitalize">{h.platform}: {h.count}</span>
                <span>{formatShortDate(h.updated_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
