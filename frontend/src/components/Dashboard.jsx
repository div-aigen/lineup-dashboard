import { useEffect, useRef, useCallback } from "react";
import { useAuth, useApi } from "@/App";
import useDashboardStore from "@/store/dashboardStore";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KPISkeleton, ChartSkeleton, SmallChartSkeleton, TableSkeleton } from "@/components/Skeleton";
import { formatTime } from "@/lib/utils";

export default function Dashboard() {
  const api = useApi();
  const { logout } = useAuth();

  const data = useDashboardStore((s) => s.data);
  const loading = useDashboardStore((s) => s.loading);
  const refreshing = useDashboardStore((s) => s.refreshing);
  const lastRefresh = useDashboardStore((s) => s.lastRefresh);
  const mobileOpen = useDashboardStore((s) => s.mobileOpen);
  const startDate = useDashboardStore((s) => s.startDate);
  const endDate = useDashboardStore((s) => s.endDate);
  const toggleMobile = useDashboardStore((s) => s.toggleMobile);
  const setDateRange = useDashboardStore((s) => s.setDateRange);
  const setRefreshing = useDashboardStore((s) => s.setRefreshing);
  const fetchAll = useDashboardStore((s) => s.fetchAll);

  const doFetch = useCallback(() => {
    fetchAll(api, logout).catch((err) => {
      if (err.message === "session_expired") {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to load dashboard data");
      }
    });
  }, [api, logout, fetchAll]);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doFetch, 300);
    return () => clearTimeout(debounceRef.current);
  }, [doFetch, startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchAll(api, logout)
      .then(() => toast.success("Dashboard refreshed"))
      .catch(() => toast.error("Failed to refresh"));
  };

  return (
    <div className="min-h-screen bg-brand-bg grid-bg flex" data-testid="dashboard-container">
      <Sidebar mobileOpen={mobileOpen} onToggle={toggleMobile} />
      <main className="flex-1 lg:ml-64 p-4 pt-16 lg:pt-6 lg:p-8 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in relative z-50">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight uppercase text-brand-text">
              Dashboard
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              {lastRefresh && `Last updated: ${formatTime(lastRefresh)}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={setDateRange}
            />
            <ExportButtons startDate={startDate} endDate={endDate} />
            <Button
              data-testid="refresh-btn"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label={refreshing ? "Refreshing dashboard data" : "Refresh dashboard data"}
              className="bg-brand-surface border-slate-700 text-slate-300 hover:bg-brand-surface-hi hover:text-white rounded-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? <KPISkeleton /> : <KPICards overview={data.overview} downloads={data.downloads} />}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {loading ? <ChartSkeleton /> : <UserGrowthChart data={data.usersGrowth} />}
          {loading ? <ChartSkeleton /> : <SessionsTrendChart data={data.sessionsTrend} />}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {loading ? <SmallChartSkeleton /> : <SportDistribution data={data.sportDist} />}
          {loading ? <SmallChartSkeleton /> : <SessionStatus data={data.sessionStatus} />}
          {loading ? <SmallChartSkeleton /> : <VenuePopularity data={data.venuePop} />}
        </div>

        {/* Downloads + Participants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {loading ? <ChartSkeleton /> : <DownloadsWidget data={data.downloads} onUpdate={doFetch} />}
          {loading ? <ChartSkeleton /> : <ParticipantsStats data={data.participantsStats} />}
        </div>

        {/* Recent Sessions */}
        <div className="mt-6">
          {loading ? <TableSkeleton /> : <RecentSessions data={data.recentSessions} />}
        </div>

        <div className="h-8" />
      </main>
    </div>
  );
}
