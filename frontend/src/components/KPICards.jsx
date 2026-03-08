import {
  Users,
  CalendarDays,
  Download,
  Activity,
  MapPin,
  UserCheck,
  TrendingUp,
} from "lucide-react";

const cards = [
  { key: "total_users", label: "Total Users", icon: Users, color: "text-brand-secondary" },
  { key: "total_sessions", label: "Sessions Created", icon: CalendarDays, color: "text-brand-accent" },
  { key: "total_downloads", label: "Total Downloads", icon: Download, color: "text-brand-primary" },
  { key: "active_sessions", label: "Active Sessions", icon: Activity, color: "text-brand-success" },
  { key: "total_venues", label: "Venues", icon: MapPin, color: "text-orange-400" },
  { key: "avg_participants", label: "Avg Participants", icon: TrendingUp, color: "text-pink-400" },
  { key: "verified_users", label: "Verified Users", icon: UserCheck, color: "text-emerald-400" },
];

export default function KPICards({ overview, downloads }) {
  if (!overview) return null;

  const vals = {
    ...overview,
    total_downloads: downloads?.total || overview.total_downloads || 0,
  };

  return (
    <div
      data-testid="kpi-cards"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 stagger-children"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            data-testid={`kpi-${card.key}`}
            className="glass-panel rounded-md p-4 border-t-2 border-brand-primary/20 hover:bg-slate-800/50 transition-colors animate-fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <Icon size={18} className={card.color} />
            </div>
            <p className="font-heading text-2xl font-bold text-brand-text">
              {vals[card.key] ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
