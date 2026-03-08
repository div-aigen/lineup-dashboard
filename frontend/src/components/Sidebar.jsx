import { useAuth } from "@/App";
import {
  LayoutDashboard,
  LogOut,
  Zap,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar({ mobileOpen, onToggle }) {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        data-testid="mobile-menu-btn"
        onClick={onToggle}
        className="fixed top-4 left-4 lg:hidden glass-panel rounded-sm p-2 text-slate-300 hover:text-white transition-colors"
        style={{ zIndex: 51 }}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay on mobile */}
      {mobileOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/60 lg:hidden"
          style={{ zIndex: 49 }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed left-0 top-0 h-screen w-64 glass-panel border-r border-slate-800/50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{ zIndex: 50 }}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-primary" />
            <span className="font-heading text-xl font-bold tracking-tight uppercase text-brand-text">
              Lineup
            </span>
          </div>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest mt-1">
            Admin Console
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-1">
            <a
              href="/"
              data-testid="nav-dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-sm bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary"
              onClick={() => { if (mobileOpen) onToggle(); }}
            >
              <LayoutDashboard size={18} />
              <span className="text-sm font-medium">Dashboard</span>
            </a>
          </div>

          <div className="mt-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-3">
              Quick Links
            </p>
            <a
              href="https://lineup-sports.in"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="nav-website-link"
              className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <ExternalLink size={18} />
              <span className="text-sm">Live Website</span>
            </a>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-500 hover:text-brand-danger hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
