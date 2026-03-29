import { useState, useEffect, createContext, useContext, useCallback, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

const Login = lazy(() => import("@/components/Login"));
const Signup = lazy(() => import("@/components/Signup"));
const Dashboard = lazy(() => import("@/components/Dashboard"));

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthContext = createContext(null);
export const ApiContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useApi() {
  return useContext(ApiContext);
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("lineup_token"));
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const api = useCallback(() => {
    return axios.create({
      baseURL: API,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    if (token) {
      axios
        .get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => setLoading(false))
        .catch(() => {
          localStorage.removeItem("lineup_token");
          setToken(null);
          setSessionExpired(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("lineup_token", newToken);
    setSessionExpired(false);
    setToken(newToken);
  };

  const logout = (expired = false) => {
    localStorage.removeItem("lineup_token");
    if (expired) setSessionExpired(true);
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <AuthContext.Provider value={{ token, login, logout }}>
      <ApiContext.Provider value={api}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f1f5f9",
            },
          }}
        />
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route
                path="/login"
                element={token ? <Navigate to="/" /> : <Login sessionExpired={sessionExpired} clearSessionExpired={() => setSessionExpired(false)} />}
              />
              <Route
                path="/signup"
                element={token ? <Navigate to="/" /> : <Signup />}
              />
              <Route
                path="/*"
                element={token ? <Dashboard /> : <Navigate to="/login" />}
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ApiContext.Provider>
    </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
