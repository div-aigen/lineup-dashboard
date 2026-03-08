import { MapPin } from "lucide-react";

const statusStyle = {
  open: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  completed: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
  full: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
};

export default function RecentSessions({ data }) {
  if (!data || data.length === 0) {
    return (
      <div data-testid="recent-sessions" className="glass-panel rounded-md p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
          Recent Sessions
        </h3>
        <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
          No sessions yet
        </div>
      </div>
    );
  }

  return (
    <div data-testid="recent-sessions" className="glass-panel rounded-md p-6 animate-fade-in">
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
        Recent Sessions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Title
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Sport
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Date
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Venue
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Creator
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Participants
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3 pr-4">
                Cost
              </th>
              <th className="text-[11px] text-slate-500 uppercase tracking-wider pb-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((session) => (
              <tr
                key={session.id}
                data-testid={`session-row-${session.id}`}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="text-sm text-brand-text font-medium">
                    {session.title}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-slate-300">{session.sport_type}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-slate-400">
                    {session.scheduled_date
                      ? new Date(session.scheduled_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <MapPin size={12} className="text-slate-600" />
                    {session.venue_name || session.location_address || "-"}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-slate-400">{session.creator_name}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-brand-text">
                    {session.participant_count}/{session.max_participants}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-slate-300">
                    {session.total_cost > 0 ? `₹${session.total_cost}` : "Free"}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-sm capitalize ${
                      statusStyle[session.status] || "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
