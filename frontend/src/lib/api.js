/**
 * API service layer for dashboard analytics endpoints.
 * All API calls go through these functions to avoid duplication.
 */

export const analyticsApi = {
  getOverview: (client, params) =>
    client.get("/analytics/overview", { params }),

  getUsersGrowth: (client, params) =>
    client.get("/analytics/users-growth", { params }),

  getSessionsTrend: (client, params) =>
    client.get("/analytics/sessions-trend", { params }),

  getSportDistribution: (client, params) =>
    client.get("/analytics/sport-distribution", { params }),

  getVenuePopularity: (client, params) =>
    client.get("/analytics/venue-popularity", { params }),

  getSessionStatus: (client, params) =>
    client.get("/analytics/session-status", { params }),

  getRecentSessions: (client, params) =>
    client.get("/analytics/recent-sessions", { params }),

  getParticipantsStats: (client, params) =>
    client.get("/analytics/participants-stats", { params }),

  fetchAll: (client, params) =>
    Promise.all([
      analyticsApi.getOverview(client, params),
      analyticsApi.getUsersGrowth(client, params),
      analyticsApi.getSessionsTrend(client, params),
      analyticsApi.getSportDistribution(client, params),
      analyticsApi.getVenuePopularity(client, params),
      analyticsApi.getSessionStatus(client, params),
      analyticsApi.getRecentSessions(client, params),
      analyticsApi.getParticipantsStats(client, params),
    ]),
};

export const settingsApi = {
  getDownloads: (client) =>
    client.get("/settings/downloads"),

  updateDownloads: (client, data) =>
    client.put("/settings/downloads", data),
};

const ALLOWED_EXPORT_TYPES = ["users", "sessions", "venues", "sports"];

export const exportApi = {
  downloadCsv: async (client, type, params) => {
    if (!ALLOWED_EXPORT_TYPES.includes(type)) {
      throw new Error(`Invalid export type: ${type}`);
    }
    const response = await client.get(`/export/${type}-csv`, {
      params,
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}_export.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const buildDateParams = (startDate, endDate) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  return params;
};
