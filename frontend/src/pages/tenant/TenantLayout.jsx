import { useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { Home, Receipt, Wrench, LogOut, Bell } from "lucide-react";
import { getSession, clearSession } from "../../services/tenantPortalService";
import { Avatar } from "../../components/UI";

const NAV = [
  { to: "dashboard", icon: Home, label: "Home" },
  { to: "bills", icon: Receipt, label: "Bills" },
  { to: "maintenance", icon: Wrench, label: "Support" },
];

export default function TenantLayout() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (!session?.tenant?.id) nav("/tenant/login", { replace: true });
  }, [session, nav]);

  if (!session?.tenant) return null;
  const tenant = session.tenant;

  const logout = () => {
    clearSession();
    nav("/tenant/login", { replace: true });
  };

  return (
    <div className="tenant-shell">
      <header className="tenant-top">
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={tenant.name} />
          <div style={{ minWidth: 0 }}>
            <div className="small muted">Selamat datang,</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, lineHeight: 1.2 }}>
              {tenant.name}
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button className="icon-btn" onClick={logout} aria-label="Logout" data-testid="tenant-logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="tenant-main">
        <Outlet />
      </main>

      <nav className="tenant-bottom">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={`/tenant/${id}/${n.to}`}
            end
            className={({ isActive }) => `tb-item ${isActive ? "active" : ""}`}
            data-testid={`tenant-nav-${n.label.toLowerCase()}`}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
