import { Trophy, Users } from "lucide-react";

/**
 * @param {Object} props
 * @param {Object} props.data - Participants stats with top_users and fill_rates arrays.
 * @param {Array<{name: string, sessions: number}>} [props.data.top_users] - Most active players.
 * @param {Array<{title: string, filled: number, max: number, rate: number}>} [props.data.fill_rates] - Session fill rates.
 */
export default function ParticipantsStats({ data }) {
  if (!data) {
    return (
      <div data-testid="participants-stats" className="glass-panel rounded-md p-6">
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-4">
          Participants
        </h3>
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div data-testid="participants-stats" className="glass-panel rounded-md p-6 animate-fade-in">
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-brand-text mb-5">
        Participants
      </h3>

      {/* Top Users */}
      {data.top_users && data.top_users.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Trophy size={12} className="text-amber-400" />
            Most Active Players
          </p>
          <div className="space-y-2">
            {data.top_users.map((user, i) => (
              <div
                key={user.name}
                data-testid={`top-user-${i}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 font-mono w-4">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-slate-300">{user.name}</span>
                </div>
                <span className="text-xs text-brand-primary font-medium">
                  {user.sessions} sessions
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fill Rates */}
      {data.fill_rates && data.fill_rates.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={12} className="text-brand-secondary" />
            Session Fill Rate
          </p>
          <div className="space-y-3">
            {data.fill_rates.map((session, i) => (
              <div key={i} data-testid={`fill-rate-${i}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 truncate max-w-[150px]">
                    {session.title}
                  </span>
                  <span className="text-slate-500">
                    {session.filled}/{session.max} ({session.rate}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(session.rate, 100)}%`,
                      backgroundColor:
                        session.rate >= 80
                          ? "#22C55E"
                          : session.rate >= 50
                          ? "#F59E0B"
                          : "#3B82F6",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
