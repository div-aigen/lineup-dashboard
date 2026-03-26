import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateRangeFilter from "@/components/DateRangeFilter";

describe("DateRangeFilter", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with 'All Time' label by default", () => {
    render(
      <DateRangeFilter startDate={null} endDate={null} onChange={mockOnChange} />
    );
    expect(screen.getByTestId("date-filter-btn")).toHaveTextContent("All Time");
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeFilter startDate={null} endDate={null} onChange={mockOnChange} />
    );

    await user.click(screen.getByTestId("date-filter-btn"));
    expect(screen.getByTestId("date-filter-dropdown")).toBeInTheDocument();
  });

  it("shows preset buttons in dropdown", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeFilter startDate={null} endDate={null} onChange={mockOnChange} />
    );

    await user.click(screen.getByTestId("date-filter-btn"));

    expect(screen.getByTestId("preset-today")).toBeInTheDocument();
    expect(screen.getByTestId("preset-last-7-days")).toBeInTheDocument();
    expect(screen.getByTestId("preset-last-30-days")).toBeInTheDocument();
    expect(screen.getByTestId("preset-this-month")).toBeInTheDocument();
    expect(screen.getByTestId("preset-all-time")).toBeInTheDocument();
  });

  it("calls onChange when a preset is selected", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeFilter startDate={null} endDate={null} onChange={mockOnChange} />
    );

    await user.click(screen.getByTestId("date-filter-btn"));
    await user.click(screen.getByTestId("preset-all-time"));

    expect(mockOnChange).toHaveBeenCalledWith(null, null);
  });

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeFilter startDate={null} endDate={null} onChange={mockOnChange} />
    );

    await user.click(screen.getByTestId("date-filter-btn"));
    expect(screen.getByTestId("date-filter-dropdown")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByTestId("date-filter-dropdown")).not.toBeInTheDocument();
    });
  });

  it("shows custom range inputs", async () => {
    const user = userEvent.setup();
    render(
      <DateRangeFilter startDate={null} endDate={null} onChange={mockOnChange} />
    );

    await user.click(screen.getByTestId("date-filter-btn"));
    expect(screen.getByTestId("date-start-input")).toBeInTheDocument();
    expect(screen.getByTestId("date-end-input")).toBeInTheDocument();
    expect(screen.getByTestId("apply-custom-date-btn")).toBeInTheDocument();
  });

  it("shows active filter label when dates are set", () => {
    render(
      <DateRangeFilter
        startDate="2026-01-01"
        endDate="2026-01-31"
        onChange={mockOnChange}
      />
    );
    expect(screen.getByTestId("date-filter-btn")).toHaveTextContent("Custom");
  });
});
