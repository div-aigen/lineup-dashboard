import { create } from "zustand";
import { analyticsApi, settingsApi, buildDateParams } from "@/lib/api";

// Load persisted filter settings from localStorage
const loadFilters = () => {
  try {
    const saved = localStorage.getItem("lineup_dashboard_filters");
    if (saved) {
      const { startDate, endDate } = JSON.parse(saved);
      return { startDate: startDate || null, endDate: endDate || null };
    }
  } catch {}
  return { startDate: null, endDate: null };
};

const persistFilters = (startDate, endDate) => {
  try {
    localStorage.setItem(
      "lineup_dashboard_filters",
      JSON.stringify({ startDate, endDate })
    );
  } catch {}
};

const useDashboardStore = create((set, get) => ({
  // Analytics data
  data: {},
  loading: true,
  refreshing: false,
  lastRefresh: null,

  // Filter state (persisted)
  ...loadFilters(),

  // UI state
  mobileOpen: false,

  // Actions
  setData: (data) => set({ data, lastRefresh: new Date() }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),

  setDateRange: (startDate, endDate) => {
    persistFilters(startDate, endDate);
    set({ startDate, endDate, loading: true });
  },

  clearFilters: () => {
    persistFilters(null, null);
    set({ startDate: null, endDate: null, loading: true });
  },

  fetchAll: async (apiFactory, logout) => {
    const { startDate, endDate } = get();
    const client = apiFactory();
    const params = buildDateParams(startDate, endDate);

    try {
      const [analyticsResults, downloads] = await Promise.all([
        analyticsApi.fetchAll(client, params),
        settingsApi.getDownloads(client),
      ]);

      const [overview, usersGrowth, sessionsTrend, sportDist, venuePop, sessionStatus, recentSessions, participantsStats] = analyticsResults;

      set({
        data: {
          overview: overview.data,
          usersGrowth: usersGrowth.data,
          sessionsTrend: sessionsTrend.data,
          sportDist: sportDist.data,
          venuePop: venuePop.data,
          sessionStatus: sessionStatus.data,
          recentSessions: recentSessions.data,
          participantsStats: participantsStats.data,
          downloads: downloads.data,
        },
        lastRefresh: new Date(),
      });
    } catch (err) {
      if (err.response?.status === 401) {
        logout(true);
        throw new Error("session_expired");
      }
      throw err;
    } finally {
      set({ loading: false, refreshing: false });
    }
  },
}));

export default useDashboardStore;
