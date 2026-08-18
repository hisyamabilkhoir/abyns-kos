import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Wrench,
  LineChart,
  Sparkles,
  FileText,
  Settings,
  Search,
  Bell,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "./UI";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/properties", icon: Building2, label: "Properties" },
  { to: "/tenants", icon: Users, label: "Tenants" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/maintenance", icon: Wrench, label: "Maintenance" },
  { to: "/finance", icon: LineChart, label: "Finance" },
  { to: "/ai", icon: Sparkles, label: "AI Assistant" },
];

const NAV_SECONDARY = [
  { to: "/reports", icon: FileText, label: "Reports", soon: true },
  { to: "/settings", icon: Settings, label: "Settings", soon: true },
];

export default function Layout() {
  const [openSide, setOpenSide] = useState(false);
  const loc = useLocation();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${openSide ? "open" : ""}`} data-testid="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">ABYNS KOS</div>
            <div className="brand-sub">AI Property OS</div>
          </div>
        </div>

        <div className="nav-label">Workspace</div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpenSide(false)}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <n.icon />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-label">More</div>
        <nav className="nav">
          {NAV_SECONDARY.map((n) => (
            <div
              key={n.to}
              className="nav-item"
              style={{ opacity: 0.5, cursor: "not-allowed" }}
              title="Coming soon"
            >
              <n.icon />
              <span>{n.label}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  color: "var(--gold-hi)",
                }}
              >
                SOON
              </span>
            </div>
          ))}
        </nav>

        <div className="owner-card" data-testid="owner-card">
          <div className="avatar sm">PA</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Pak Adi</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Property Owner</div>
          </div>
          <ChevronRight size={16} style={{ opacity: 0.4 }} />
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button
            className="icon-btn"
            style={{ display: "none" }}
            onClick={() => setOpenSide((v) => !v)}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
          <div className="search">
            <Search size={16} style={{ color: "var(--muted)" }} />
            <input placeholder="Search rooms, tenants, invoices..." data-testid="global-search" />
            <span className="badge badge-neutral" style={{ padding: "2px 8px" }}>
              ⌘K
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" aria-label="Notifications" data-testid="notifications-btn">
            <Bell size={18} />
            <span className="dot" />
          </button>
          <div className="avatar sm" data-testid="owner-avatar">
            PA
          </div>
        </div>
        <Outlet key={loc.pathname} />
      </main>
    </div>
  );
}
