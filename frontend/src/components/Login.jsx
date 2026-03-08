import { useState } from "react";
import { useAuth } from "@/App";
import axios from "axios";
import { Eye, EyeOff, Zap } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      login(res.data.token);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1765130729366-b54d7b2c8ea2?crop=entropy&cs=srgb&fm=jpg&q=85)`,
        }}
      />
      <div className="absolute inset-0 bg-brand-bg/90" />
      <div className="absolute inset-0 grid-bg" />

      {/* Login card */}
      <div
        data-testid="login-card"
        className="relative z-10 glass-panel rounded-md p-8 w-full max-w-md animate-fade-in"
      >
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Zap className="w-7 h-7 text-brand-primary" />
            <span className="font-heading text-3xl font-bold tracking-tight uppercase text-brand-text">
              Lineup
            </span>
          </div>
          <p className="text-brand-muted text-sm tracking-wider uppercase">
            Admin Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium tracking-wider text-slate-500 uppercase block mb-2">
              Email
            </label>
            <input
              data-testid="login-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-surface border border-slate-700 rounded-sm px-4 py-3 text-brand-text placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-colors"
              placeholder="admin@lineup-sports.in"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-slate-500 uppercase block mb-2">
              Password
            </label>
            <div className="relative">
              <input
                data-testid="login-password-input"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-surface border border-slate-700 rounded-sm px-4 py-3 text-brand-text placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-colors pr-12"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                data-testid="toggle-password-btn"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p data-testid="login-error" className="text-brand-danger text-sm">
              {error}
            </p>
          )}

          <button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-primary-fg font-bold uppercase tracking-wide rounded-sm py-3 hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          Lineup Sports Admin Panel
        </p>
      </div>
    </div>
  );
}
