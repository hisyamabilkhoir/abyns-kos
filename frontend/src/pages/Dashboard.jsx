import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDashboard } from "../services/dashboardService";
import { Card, KpiCard, Badge, Avatar, CircularScore, Skeleton, EmptyState } from "../components/UI";
import { currency, compact } from "../services/api";
import { ArrowUpRight, Sparkles, ArrowRight, Clock, AlertCircle } from "lucide-react";

const COLORS = ["#1f8f5a", "#c58a12", "#b91c3c"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getDashboard().then(setData).catch(console.error);
  }, []);

  if (!data)
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Loading…</h1>
          </div>
        </div>
        <div className="kpi-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kpi">
              <Skeleton h={12} w="50%" />
              <div style={{ height: 12 }} />
              <Skeleton h={30} w="70%" />
            </div>
          ))}
        </div>
      </>
    );

  const { kpis, health, payment_overview, revenue_history, upcoming_billing, overdue_tenants, activity } = data;

  const pie = [
    { name: "Paid", value: payment_overview.paid },
    { name: "Pending", value: payment_overview.pending },
    { name: "Overdue", value: payment_overview.overdue },
  ];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>
            Good Morning, {data.owner_name} <span style={{ fontFamily: "system-ui" }}>👋</span>
          </h1>
          <div className="sub">Here&apos;s what needs your attention today.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Badge variant="info" dot>
            {data.property_name}
          </Badge>
          <Link to="/ai" className="btn btn-primary btn-sm" data-testid="dashboard-ask-ai">
            Ask ABYNS AI <Sparkles size={14} />
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid reveal">
        <KpiCard label="Total Rooms" value={kpis.total_rooms} testid="kpi-total-rooms" />
        <KpiCard
          label="Occupied"
          value={kpis.occupied}
          delta={`${kpis.occupancy_pct}% occupancy`}
          accent="var(--success)"
          testid="kpi-occupied"
        />
        <KpiCard label="Available" value={kpis.available} testid="kpi-available" />
        <KpiCard label="Maintenance" value={kpis.maintenance} testid="kpi-maintenance" />
        <KpiCard
          tone="gold"
          label="Revenue MTD"
          value={compact(kpis.revenue)}
          delta={`▲ ${kpis.revenue_change_pct}%`}
          accent="var(--success)"
          testid="kpi-revenue"
        />
        <KpiCard
          tone="royal"
          label="Outstanding"
          value={compact(kpis.outstanding)}
          delta="Butuh perhatian"
          accent="var(--danger)"
          testid="kpi-outstanding"
        />
      </div>

      {/* ROW 1: HEALTH + AI INSIGHT + OCCUPANCY */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <Card title="Property Health" data-testid="health-card">
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <CircularScore value={health.overall} label="Very Healthy" />
          </div>
          <div className="health-list">
            {[
              ["Occupancy", health.occupancy],
              ["Payments", health.payments],
              ["Maintenance", health.maintenance],
              ["Revenue", health.revenue],
              ["Tenant Experience", health.tenant_experience],
            ].map(([n, v]) => (
              <div key={n} className="health-row">
                <div className="small" style={{ color: "var(--ink-2)" }}>{n}</div>
                <div className="health-bar"><span style={{ width: `${v}%` }} /></div>
                <div className="small mono" style={{ textAlign: "right", fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="ai-card" data-testid="ai-insight-card" style={{ borderRadius: "var(--r-lg)" }}>
          <div className="ai-eyebrow"><span className="pulse" /> ABYNS AI INSIGHT</div>
          <div className="ai-insight">
            Revenue naik {kpis.revenue_change_pct}% bulan ini, tapi 3 kamar telah kosong lebih dari 20 hari.
          </div>
          <div className="ai-reco">
            Rekomendasi: prioritaskan <b>A-07</b> — review harga & listing. Estimasi tambahan revenue: +Rp5,1Jt.
          </div>
          <div className="ai-actions">
            <Link to="/ai" className="btn btn-gold btn-sm" data-testid="ai-view-analysis">
              Ask ABYNS AI <ArrowRight size={14} />
            </Link>
            <Link to="/properties" className="btn btn-soft btn-sm" style={{ color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              View Analysis
            </Link>
          </div>
        </div>

        <Card title="Occupancy" data-testid="occupancy-card">
          <CircularScore value={kpis.occupancy_pct} label="OCCUPIED" />
          <div className="row between" style={{ marginTop: 18 }}>
            <div className="col" style={{ gap: 2 }}>
              <span className="badge badge-success badge-dot">Occupied</span>
              <div className="mono" style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{kpis.occupied}</div>
            </div>
            <div className="col" style={{ gap: 2 }}>
              <span className="badge badge-gold badge-dot">Available</span>
              <div className="mono" style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{kpis.available}</div>
            </div>
            <div className="col" style={{ gap: 2 }}>
              <span className="badge badge-danger badge-dot">Maintenance</span>
              <div className="mono" style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{kpis.maintenance}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ROW 2: REVENUE CHART + PAYMENT OVERVIEW */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <Card title="Revenue — Last 6 Months" data-testid="revenue-chart-card"
          actions={<Badge variant="success" dot>▲ {kpis.revenue_change_pct}%</Badge>}>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <AreaChart data={revenue_history} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4a1e6a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4a1e6a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece7f2" vertical={false} />
                <XAxis dataKey="month" stroke="#7a7386" tickLine={false} axisLine={false} />
                <YAxis stroke="#7a7386" tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1e6)}Jt`} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #ece7f2", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => currency(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4a1e6a" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payment Overview" data-testid="payment-overview-card"
          actions={<Link to="/billing" className="small" style={{ color: "var(--royal)", fontWeight: 600 }}>View All →</Link>}>
          <div className="row" style={{ alignItems: "center", gap: 12 }}>
            <div style={{ width: 160, height: 160, position: "relative" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value">
                    {pie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
                <div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>{compact(payment_overview.total)}</div>
                  <div className="small muted">Total</div>
                </div>
              </div>
            </div>
            <div className="col" style={{ gap: 10, flex: 1 }}>
              {[
                ["Paid", payment_overview.paid, "success"],
                ["Pending", payment_overview.pending, "warn"],
                ["Overdue", payment_overview.overdue, "danger"],
              ].map(([n, v, tone]) => (
                <div key={n} className="row between">
                  <Badge variant={tone} dot>{n}</Badge>
                  <div className="mono" style={{ fontWeight: 700 }}>{currency(v)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ROW 3: UPCOMING + OVERDUE + ACTIVITY */}
      <div className="grid-3">
        <Card title="Upcoming Billing" data-testid="upcoming-billing-card"
          actions={<Link to="/billing" className="small" style={{ color: "var(--royal)", fontWeight: 600 }}>View All →</Link>}>
          {upcoming_billing.length === 0 ? (
            <EmptyState icon={<Clock size={26} />} title="You're all set." desc="No upcoming bills." />
          ) : upcoming_billing.map((u) => (
            <div key={u.invoice_id} className="row between" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div className="row" style={{ gap: 10 }}>
                <Avatar name={u.tenant_name} />
                <div>
                  <div style={{ fontWeight: 600 }}>{u.tenant_name}</div>
                  <div className="small muted">{u.room_number} · {currency(u.amount)}</div>
                </div>
              </div>
              <Badge variant={u.days_diff === 0 ? "warn" : "info"} dot>
                {u.days_diff === 0 ? "Due Today" : `Due in ${u.days_diff}d`}
              </Badge>
            </div>
          ))}
        </Card>

        <Card title="Overdue Tenants" data-testid="overdue-tenants-card"
          actions={<Link to="/billing" className="small" style={{ color: "var(--danger)", fontWeight: 600 }}>View Billing →</Link>}>
          {overdue_tenants.length === 0 ? (
            <EmptyState icon={<span>✓</span>} title="Great. Everyone is up to date." />
          ) : overdue_tenants.map((o) => (
            <div key={o.invoice_id} className="row between" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div className="row" style={{ gap: 10 }}>
                <Avatar name={o.tenant_name} />
                <div>
                  <div style={{ fontWeight: 600 }}>{o.tenant_name}</div>
                  <div className="small muted">{o.room_number} · {currency(o.amount)}</div>
                </div>
              </div>
              <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                <Badge variant="danger" dot>Overdue {Math.abs(o.days_diff)}d</Badge>
                <Badge variant={o.priority === "high" ? "danger" : "warn"}>
                  Priority {o.priority}
                </Badge>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Recent Activity" data-testid="activity-card">
          {(activity || []).length === 0 ? (
            <EmptyState icon={<AlertCircle size={26} />} title="No recent activity." />
          ) : activity.slice(0, 6).map((a, i) => (
            <div key={i} className="row" style={{ gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)", alignItems: "flex-start" }}>
              <div className="avatar sm" style={{ background: "#efe8f8" }}>
                <ArrowUpRight size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                <div className="small muted">{a.message}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
