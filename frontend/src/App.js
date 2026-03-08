import { useState, useEffect, createContext, useContext, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";

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

  const api = useCallback(() => {
    return axios.create({
      baseURL: API,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  useEffect(() => {
    if (token) {
      axios
        .get(`${API}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => setLoading(false))
        .catch(() => {
          localStorage.removeItem("lineup_token");
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("lineup_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("lineup_token");
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
    <AuthContext.Provider value={{ token, login, logout }}>
      <ApiContext.Provider value={api}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="/*"
              element={token ? <Dashboard /> : <Navigate to="/login" />}
            />
          </Routes>
        </BrowserRouter>
      </ApiContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
