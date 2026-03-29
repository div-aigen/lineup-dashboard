import useDashboardStore from "@/store/dashboardStore";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("dashboardStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state
    useDashboardStore.setState({
      data: {},
      loading: true,
      refreshing: false,
      lastRefresh: null,
      startDate: null,
      endDate: null,
      mobileOpen: false,
    });
  });

  it("has correct initial state", () => {
    const state = useDashboardStore.getState();
    expect(state.data).toEqual({});
    expect(state.loading).toBe(true);
    expect(state.refreshing).toBe(false);
    expect(state.mobileOpen).toBe(false);
    expect(state.startDate).toBeNull();
    expect(state.endDate).toBeNull();
  });

  it("toggles mobile menu", () => {
    const { toggleMobile } = useDashboardStore.getState();
    expect(useDashboardStore.getState().mobileOpen).toBe(false);

    toggleMobile();
    expect(useDashboardStore.getState().mobileOpen).toBe(true);

    toggleMobile();
    expect(useDashboardStore.getState().mobileOpen).toBe(false);
  });

  it("sets date range and persists to localStorage", () => {
    const { setDateRange } = useDashboardStore.getState();

    setDateRange("2026-01-01", "2026-01-31");

    const state = useDashboardStore.getState();
    expect(state.startDate).toBe("2026-01-01");
    expect(state.endDate).toBe("2026-01-31");
    expect(state.loading).toBe(true);

    const saved = JSON.parse(localStorage.getItem("lineup_dashboard_filters"));
    expect(saved.startDate).toBe("2026-01-01");
    expect(saved.endDate).toBe("2026-01-31");
  });

  it("clears filters and persists to localStorage", () => {
    const { setDateRange, clearFilters } = useDashboardStore.getState();

    setDateRange("2026-01-01", "2026-01-31");
    clearFilters();

    const state = useDashboardStore.getState();
    expect(state.startDate).toBeNull();
    expect(state.endDate).toBeNull();

    const saved = JSON.parse(localStorage.getItem("lineup_dashboard_filters"));
    expect(saved.startDate).toBeNull();
    expect(saved.endDate).toBeNull();
  });

  it("sets data and updates lastRefresh", () => {
    const { setData } = useDashboardStore.getState();
    const mockData = { overview: { total_users: 100 } };

    setData(mockData);

    const state = useDashboardStore.getState();
    expect(state.data).toEqual(mockData);
    expect(state.lastRefresh).toBeInstanceOf(Date);
  });

  it("fetchAll calls API and stores data", async () => {
    const mockResponse = (data) => ({ data });
    const mockClient = {
      get: jest.fn()
        .mockResolvedValueOnce(mockResponse({ total_users: 10 }))
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse([]))
        .mockResolvedValueOnce(mockResponse({}))
        .mockResolvedValueOnce(mockResponse({ total: 50 })),
    };
    const mockApiFactory = () => mockClient;
    const mockLogout = jest.fn();

    const { fetchAll } = useDashboardStore.getState();
    await fetchAll(mockApiFactory, mockLogout);

    const state = useDashboardStore.getState();
    expect(state.data.overview).toEqual({ total_users: 10 });
    expect(state.data.downloads).toEqual({ total: 50 });
    expect(state.loading).toBe(false);
    expect(state.refreshing).toBe(false);
    expect(mockClient.get).toHaveBeenCalledTimes(9);
  });

  it("fetchAll calls logout on 401", async () => {
    const mockClient = {
      get: jest.fn().mockRejectedValueOnce({ response: { status: 401 } }),
    };
    const mockApiFactory = () => mockClient;
    const mockLogout = jest.fn();

    const { fetchAll } = useDashboardStore.getState();

    await expect(fetchAll(mockApiFactory, mockLogout)).rejects.toThrow(
      "session_expired"
    );
    expect(mockLogout).toHaveBeenCalled();
  });
});
