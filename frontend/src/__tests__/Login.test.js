import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Login from "@/components/Login";

// Mock axios
jest.mock("axios");

// Mock sonner
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Mock @/App to avoid pulling in react-router-dom
const mockLogin = jest.fn();
jest.mock("@/App", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext(null),
    useAuth: () => ({ login: mockLogin }),
  };
});

describe("Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form with email and password fields", () => {
    render(<Login />);
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
  });

  it("shows password when toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<Login />);
    const passwordInput = screen.getByTestId("login-password-input");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByTestId("toggle-password-btn"));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByTestId("toggle-password-btn"));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("calls login on successful submission", async () => {
    const mockToken = "test-jwt-token";
    axios.post.mockResolvedValueOnce({ data: { token: mockToken } });

    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "admin@test.com");
    await user.type(screen.getByTestId("login-password-input"), "password123");
    await user.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockToken);
    });
  });

  it("shows error message on failed login", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { detail: "Invalid credentials" } },
    });

    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "wrong@test.com");
    await user.type(screen.getByTestId("login-password-input"), "wrongpassword");
    await user.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error")).toHaveTextContent(
        "Invalid credentials"
      );
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "admin@test.com");
    await user.type(screen.getByTestId("login-password-input"), "short");
    await user.click(screen.getByTestId("login-submit-btn"));

    expect(screen.getByTestId("login-error")).toHaveTextContent(
      "Password must be at least 6 characters"
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "notanemail");
    await user.type(screen.getByTestId("login-password-input"), "password123");
    await user.click(screen.getByTestId("login-submit-btn"));

    expect(screen.getByTestId("login-error")).toHaveTextContent(
      "Please enter a valid email address"
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("shows session expired banner when sessionExpired prop is true", () => {
    render(<Login sessionExpired={true} clearSessionExpired={jest.fn()} />);
    expect(screen.getByText("Your session has expired. Please sign in again.")).toBeInTheDocument();
  });

  it("disables submit button while loading", async () => {
    axios.post.mockReturnValueOnce(new Promise(() => {}));

    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByTestId("login-email-input"), "admin@test.com");
    await user.type(screen.getByTestId("login-password-input"), "password123");
    await user.click(screen.getByTestId("login-submit-btn"));

    expect(screen.getByTestId("login-submit-btn")).toBeDisabled();
    expect(screen.getByTestId("login-submit-btn")).toHaveTextContent(
      "Authenticating..."
    );
  });
});
