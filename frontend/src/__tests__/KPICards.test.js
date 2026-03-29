import { render, screen } from "@testing-library/react";
import KPICards from "@/components/KPICards";

describe("KPICards", () => {
  it("renders nothing when overview is null", () => {
    const { container } = render(<KPICards overview={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all KPI cards with correct values", () => {
    const overview = {
      total_users: 150,
      total_sessions: 42,
      active_sessions: 5,
      total_venues: 12,
      avg_participants: 8,
      verified_users: 120,
    };
    const downloads = { total: 300 };

    render(<KPICards overview={overview} downloads={downloads} />);

    expect(screen.getByTestId("kpi-cards")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-total_users")).toHaveTextContent("150");
    expect(screen.getByTestId("kpi-total_sessions")).toHaveTextContent("42");
    expect(screen.getByTestId("kpi-total_downloads")).toHaveTextContent("300");
    expect(screen.getByTestId("kpi-active_sessions")).toHaveTextContent("5");
    expect(screen.getByTestId("kpi-total_venues")).toHaveTextContent("12");
    expect(screen.getByTestId("kpi-avg_participants")).toHaveTextContent("8");
    expect(screen.getByTestId("kpi-verified_users")).toHaveTextContent("120");
  });

  it("uses overview total_downloads when downloads prop is missing", () => {
    const overview = { total_downloads: 50 };
    render(<KPICards overview={overview} />);

    expect(screen.getByTestId("kpi-total_downloads")).toHaveTextContent("50");
  });

  it("shows 0 for missing values", () => {
    render(<KPICards overview={{}} />);

    expect(screen.getByTestId("kpi-total_users")).toHaveTextContent("0");
    expect(screen.getByTestId("kpi-total_sessions")).toHaveTextContent("0");
  });
});
