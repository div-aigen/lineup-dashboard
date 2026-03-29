import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportButtons from "@/components/ExportButtons";

// Mock @/App to avoid pulling in react-router-dom
const mockGet = jest.fn();
const mockApi = () => ({ get: mockGet });
jest.mock("@/App", () => {
  const React = require("react");
  return {
    ApiContext: React.createContext(null),
    useApi: () => mockApi,
  };
});

describe("ExportButtons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders export button", () => {
    render(<ExportButtons startDate={null} endDate={null} />);
    expect(screen.getByTestId("export-btn")).toHaveTextContent("Export CSV");
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(<ExportButtons startDate={null} endDate={null} />);

    await user.click(screen.getByTestId("export-btn"));
    expect(screen.getByTestId("export-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("export-users-btn")).toBeInTheDocument();
    expect(screen.getByTestId("export-sessions-btn")).toBeInTheDocument();
    expect(screen.getByTestId("export-participants-btn")).toBeInTheDocument();
  });

  it("has correct ARIA attributes", async () => {
    const user = userEvent.setup();
    render(<ExportButtons startDate={null} endDate={null} />);

    const btn = screen.getByTestId("export-btn");
    expect(btn).toHaveAttribute("aria-haspopup", "true");
    expect(btn).toHaveAttribute("aria-expanded", "false");

    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("export-dropdown")).toHaveAttribute("role", "menu");
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    render(<ExportButtons startDate={null} endDate={null} />);

    await user.click(screen.getByTestId("export-btn"));
    expect(screen.getByTestId("export-dropdown")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByTestId("export-dropdown")).not.toBeInTheDocument();
    });
  });

  it("navigates with arrow keys", async () => {
    const user = userEvent.setup();
    render(<ExportButtons startDate={null} endDate={null} />);

    await user.click(screen.getByTestId("export-btn"));

    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("export-sessions-btn")).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByTestId("export-users-btn")).toHaveFocus();
  });
});
