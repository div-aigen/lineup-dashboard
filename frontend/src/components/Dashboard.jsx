import { useState, useEffect, useCallback } from "react";
import { useAuth, useApi } from "@/App";
import Sidebar from "@/components/Sidebar";
import KPICards from "@/components/KPICards";
import UserGrowthChart from "@/components/UserGrowthChart";
import SessionsTrendChart from "@/components/SessionsTrendChart";
import SportDistribution from "@/components/SportDistribution";
import VenuePopularity from "@/components/VenuePopularity";
import SessionStatus from "@/components/SessionStatus";
import RecentSessions from "@/components/RecentSessions";
import DownloadsWidget from "@/components/DownloadsWidget";
import ParticipantsStats from "@/components/ParticipantsStats";
import DateRangeFilter from "@/components/DateRangeFilter";
import ExportButtons from "@/components/ExportButtons";
import { RefreshCw } from "lucide-react";

export default function Dashboard() {
  const api = useApi();
  const { logout } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchAll = useCallback(async (sd, ed) => {
    const client = api();
    const params = {};
    if (sd) params.start_date = sd;
    if (ed) params.end_date = ed;
    try {
      const [overview, usersGrowth, sessionsTrend, sportDist, venuePop, sessionStatus, recentSessions, participantsStats, downloads] =
        await Promise.all([
          client.get("/analytics/overview", { params }),
          client.get("/analytics/users-growth", { params }),
          client.get("/analytics/sessions-trend", { params }),
          client.get("/analytics/sport-distribution", { params }),
          client.get("/analytics/venue-popularity", { params }),
          client.get("/analytics/session-status", { params }),
          client.get("/analytics/recent-sessions", { params }),
          client.get("/analytics/participants-stats", { params }),
          client.get("/settings/downloads"),
        ]);

      setData({
        overview: overview.data,
        usersGrowth: usersGrowth.data,
        sessionsTrend: sessionsTrend.data,
        sportDist: sportDist.data,
        venuePop: venuePop.data,
        sessionStatus: sessionStatus.data,
        recentSessions: recentSessions.data,
        participantsStats: participantsStats.data,
        downloads: downloads.data,
      });
      setLastRefresh(new Date());
    } catch (err) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, logout]);

  useEffect(() => {
    fetchAll(startDate, endDate);
  }, [fetchAll, startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll(startDate, endDate);
  };

  const handleDateChange = (sd, ed) => {
    setStartDate(sd);
    setEndDate(ed);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-muted text-sm uppercase tracking-wider">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg grid-bg flex" data-testid="dashboard-container">
      <Sidebar mobileOpen={mobileOpen} onToggle={() => setMobileOpen(!mobileOpen)} />
      <main className="flex-1 lg:ml-64 p-4 pt-16 lg:pt-6 lg:p-8 overflow-auto min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight uppercase text-brand-text">
              Dashboard
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
            <ExportButtons startDate={startDate} endDate={endDate} />
            <button
              data-testid="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 bg-brand-surface border border-slate-700 rounded-sm px-3 py-2 text-slate-300 hover:bg-brand-surface-hi hover:text-white transition-colors text-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards overview={data.overview} downloads={data.downloads} />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <UserGrowthChart data={data.usersGrowth} />
          <SessionsTrendChart data={data.sessionsTrend} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <SportDistribution data={data.sportDist} />
          <SessionStatus data={data.sessionStatus} />
          <VenuePopularity data={data.venuePop} />
        </div>

        {/* Downloads + Participants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DownloadsWidget data={data.downloads} onUpdate={() => fetchAll(startDate, endDate)} />
          <ParticipantsStats data={data.participantsStats} />
        </div>

        {/* Recent Sessions */}
        <div className="mt-6">
          <RecentSessions data={data.recentSessions} />
        </div>

        <div className="h-8" />
      </main>
    </div>
  );
}
