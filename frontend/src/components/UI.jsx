import { initials } from "../services/api";

export const Card = ({ children, className = "", title, actions, hoverable, ...rest }) => (
  <div className={`card ${hoverable ? "card-hoverable" : ""} ${className}`} {...rest}>
    {(title || actions) && (
      <div className="row between" style={{ marginBottom: 14 }}>
        {title && <div className="card-title">{title}</div>}
        {actions}
      </div>
    )}
    {children}
  </div>
);

export const Badge = ({ variant = "neutral", dot, children, ...rest }) => (
  <span className={`badge badge-${variant} ${dot ? "badge-dot" : ""}`} {...rest}>
    {children}
  </span>
);

export const Avatar = ({ name = "", size = "" }) => (
  <div className={`avatar ${size}`} data-testid={`avatar-${name}`}>
    {initials(name)}
  </div>
);

export const KpiCard = ({ label, value, delta, tone = "", accent, testid }) => (
  <div className={`kpi ${tone}`} data-testid={testid}>
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    {delta && (
      <div className="delta" style={{ color: accent || "var(--success)" }}>
        {delta}
      </div>
    )}
  </div>
);

export const CircularScore = ({ value = 0, max = 100, label = "SCORE" }) => {
  const r = 78;
  const c = 2 * Math.PI * r;
  const off = c - (value / max) * c;
  return (
    <div className="circular" data-testid="circular-score">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a1e6a" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={r} fill="none" stroke="#ece7f2" strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="url(#cg)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="center">
        <div>
          <div className="score">{value}</div>
          <div className="label">{label}</div>
        </div>
      </div>
    </div>
  );
};

export const Skeleton = ({ w = "100%", h = 16, style = {} }) => (
  <div className="skel" style={{ width: w, height: h, ...style }} />
);

export const EmptyState = ({ title = "Nothing to see here", desc, icon }) => (
  <div className="empty">
    {icon && <div style={{ fontSize: 30, color: "var(--royal)" }}>{icon}</div>}
    <h4>{title}</h4>
    {desc && <div>{desc}</div>}
  </div>
);

export const statusVariant = (s) => {
  const map = {
    paid: "success",
    verified: "success",
    completed: "success",
    active: "success",
    available: "gold",
    pending: "warn",
    waiting: "warn",
    due_soon: "warn",
    due_today: "warn",
    in_progress: "info",
    overdue: "danger",
    maintenance: "danger",
    occupied: "info",
    reserved: "gold",
    high: "danger",
    medium: "warn",
    low: "neutral",
  };
  return map[s] || "neutral";
};

export const statusLabel = (s) => {
  const map = {
    paid: "PAID",
    pending: "PENDING",
    overdue: "OVERDUE",
    verified: "VERIFIED",
    waiting: "WAITING",
    in_progress: "IN PROGRESS",
    completed: "COMPLETED",
    available: "AVAILABLE",
    occupied: "OCCUPIED",
    maintenance: "MAINTENANCE",
    reserved: "RESERVED",
    active: "ACTIVE",
    due_today: "DUE TODAY",
    due_soon: "DUE SOON",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
  };
  return map[s] || (s || "").toUpperCase();
};
