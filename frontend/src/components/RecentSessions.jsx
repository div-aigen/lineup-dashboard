import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFullDate, formatCost, formatParticipants } from "@/lib/utils";

const statusVariant = {
  open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/15",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/15",
  full: "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
};

function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-sm capitalize text-xs ${statusVariant[status] || "bg-slate-700 text-slate-400"}`}
    >
      {status}
    </Badge>
  );
}

function SessionCard({ session }) {
  return (
    <div
      data-testid={`session-row-${session.id}`}
      className="bg-brand-surface rounded-md p-4 border border-slate-800/50 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-brand-text font-medium leading-tight">
          {session.title}
        </span>
        <StatusBadge status={session.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Sport</span>
          <p className="text-slate-300">{session.sport_type}</p>
        </div>
        <div>
          <span className="text-slate-500">Date</span>
          <p className="text-slate-300">
            {session.scheduled_date ? formatFullDate(session.scheduled_date) : "-"}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Players</span>
          <p className="text-brand-text">
            {formatParticipants(session.participant_count, session.max_participants)}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Cost</span>
          <p className="text-slate-300">
            {formatCost(session.total_cost)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin size={12} className="text-slate-600" />
          <span className="truncate max-w-[140px]">
            {session.venue_name || session.location_address || "-"}
          </span>
        </div>
        <span className="text-slate-500">{session.creator_name}</span>
      </div>
    </div>
  );
}

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

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {data.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Title
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Sport
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Venue
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Creator
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Participants
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Cost
              </TableHead>
              <TableHead className="text-[11px] text-slate-500 uppercase tracking-wider">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((session) => (
              <TableRow
                key={session.id}
                data-testid={`session-row-${session.id}`}
                className="border-slate-800/50 hover:bg-slate-800/30"
              >
                <TableCell>
                  <span className="text-sm text-brand-text font-medium">
                    {session.title}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-300">{session.sport_type}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-400">
                    {session.scheduled_date
                      ? new Date(session.scheduled_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <MapPin size={12} className="text-slate-600" />
                    {session.venue_name || session.location_address || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-400">{session.creator_name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-brand-text">
                    {formatParticipants(session.participant_count, session.max_participants)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-300">
                    {formatCost(session.total_cost)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={session.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
