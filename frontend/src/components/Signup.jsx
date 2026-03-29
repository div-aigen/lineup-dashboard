import { useState } from "react";
import { useAuth } from "@/App";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim()) return "Email is required";
    if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
        email: email.trim(),
        password,
      });
      login(res.data.token);
      toast.success("Account created successfully");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || "Signup failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1765130729366-b54d7b2c8ea2?crop=entropy&cs=srgb&fm=jpg&q=85)`,
        }}
      />
      <div className="absolute inset-0 bg-brand-bg/90" />
      <div className="absolute inset-0 grid-bg" />

      <div className="relative z-10 glass-panel rounded-md p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Zap className="w-7 h-7 text-brand-primary" />
            <span className="font-heading text-3xl font-bold tracking-tight uppercase text-brand-text">
              Lineup
            </span>
          </div>
          <p className="text-brand-muted text-sm tracking-wider uppercase">
            Create Admin Account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium tracking-wider text-slate-500 uppercase block mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-brand-surface border-slate-700 text-brand-text placeholder:text-slate-600 focus-visible:ring-brand-primary/50 rounded-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider text-slate-500 uppercase block mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-brand-surface border-slate-700 text-brand-text placeholder:text-slate-600 focus-visible:ring-brand-primary/50 rounded-sm pr-12"
                placeholder="Min 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-brand-danger text-sm">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-primary-fg font-bold uppercase tracking-wide rounded-sm h-11 hover:bg-brand-primary/90"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
