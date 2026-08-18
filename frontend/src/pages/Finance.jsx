import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line,
  Area,
} from "recharts";
import { getFinanceSummary, listExpenses, getRetention } from "../services/financeService";
import { Card, KpiCard, Badge, Skeleton } from "../components/UI";
import { currency, compact } from "../services/api";
import { TrendingUp, TrendingDown, Users, RefreshCw } from "lucide-react";

const CAT_COLORS = {
  Maintenance: "#b91c3c",
  Utilities: "#4a1e6a",
  Internet: "#1f8f5a",
  Cleaning: "#c58a12",
  Staff: "#d4af37",
  Other: "#7a7386",
};

export default function Finance() {
  const [sum, setSum] = useState(null);
  const [exp, setExp] = useState(null);
  const [ret, setRet] = useState(null);

  useEffect(() => {
    Promise.all([getFinanceSummary(), listExpenses(), getRetention()]).then(([a, b, c]) => {
      setSum(a);
      setExp(b);
      setRet(c);
    });
  }, []);

  if (!sum || !exp || !ret) return <Skeleton h={340} />;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Finance</h1>
          <div className="sub">Revenue, expenses, and net income overview.</div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KpiCard tone="gold" label="Revenue" value={currency(sum.revenue)} delta="Bulan ini" accent="var(--success)" />
        <KpiCard label="Expenses" value={currency(sum.expenses)} delta="Total keluar" accent="var(--danger)" />
        <KpiCard tone="royal" label="Net Income" value={currency(sum.net)} delta="Margin bulan ini" accent="var(--success)" />
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Card title="Revenue vs Expenses — Last 6 Months">
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={sum.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece7f2" vertical={false} />
                <XAxis dataKey="month" stroke="#7a7386" tickLine={false} axisLine={false} />
                <YAxis stroke="#7a7386" tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1e6)}Jt`} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={{ background: "#fff", border: "1px solid #ece7f2", borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="revenue" fill="#4a1e6a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#d4af37" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Expense Categories">
          <div className="col" style={{ gap: 12 }}>
            {sum.categories.map((c) => {
              const pct = Math.round((c.amount / sum.expenses) * 100);
              return (
                <div key={c.category}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[c.category] || "#7a7386" }} />
                      <span style={{ fontWeight: 600 }}>{c.category}</span>
                    </div>
                    <div className="mono small" style={{ fontWeight: 700 }}>{compact(c.amount)}</div>
                  </div>
                  <div className="health-bar">
                    <span style={{ width: `${pct}%`, background: CAT_COLORS[c.category] || "#7a7386" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Recent Expenses" style={{ marginTop: 20 }}>
        <table className="table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            {exp.slice(0, 12).map((e) => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td><Badge variant="neutral" dot>{e.category}</Badge></td>
                <td>{e.description}</td>
                <td className="mono" style={{ fontWeight: 700 }}>{currency(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* RENEWAL INSIGHTS */}
      <div className="page-head" style={{ marginTop: 40, marginBottom: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Renewal Insights</h1>
          <div className="sub">
            Tingkat kepuasan properti — {ret.avg_active_tenure_months} bulan rata-rata tinggal tenant aktif.
          </div>
        </div>
        <Badge variant={ret.overall_retention_pct >= 85 ? "success" : ret.overall_retention_pct >= 70 ? "warn" : "danger"} dot>
          {ret.overall_retention_pct}% overall retention
        </Badge>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard
          tone="royal"
          label="Retention Rate"
          value={`${ret.current_month_retention}%`}
          delta={`Overall ${ret.overall_retention_pct}%`}
          accent="var(--success)"
          testid="kpi-retention"
        />
        <KpiCard
          label="Renewals bulan ini"
          value={ret.renewals_this_month}
          delta={`Aktual ${ret.total_renewed_actual} lifetime`}
          accent="var(--info)"
          testid="kpi-renewals"
        />
        <KpiCard
          label="Churn Rate"
          value={`${ret.overall_churn_pct}%`}
          delta="6-bulan rata-rata"
          accent="var(--danger)"
          testid="kpi-churn"
        />
        <KpiCard
          tone="gold"
          label="Avg. Tenure"
          value={`${ret.avg_active_tenure_months} bln`}
          delta={`${ret.active_tenants} tenant aktif`}
          accent="var(--success)"
          testid="kpi-tenure"
        />
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Card
          title="Retention & Churn — 6 Bulan"
          data-testid="retention-chart"
          actions={
            <div className="row" style={{ gap: 8 }}>
              <div className="row small" style={{ gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#4a1e6a" }} />
                <span>Renewed</span>
              </div>
              <div className="row small" style={{ gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#b91c3c" }} />
                <span>Churned</span>
              </div>
              <div className="row small" style={{ gap: 4 }}>
                <span style={{ width: 10, height: 2, background: "#d4af37" }} />
                <span>Retention %</span>
              </div>
            </div>
          }
        >
          <div className="chart-wrap" style={{ height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={ret.months} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="retArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece7f2" vertical={false} />
                <XAxis dataKey="month" stroke="#7a7386" tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#7a7386"
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Tenants", angle: -90, position: "insideLeft", fill: "#7a7386", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#a87522"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[60, 100]}
                />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #ece7f2", borderRadius: 12, fontSize: 12 }}
                  formatter={(v, n) => (n === "retention_pct" ? `${v}%` : v)}
                />
                <Bar yAxisId="left" dataKey="renewed" fill="#4a1e6a" radius={[8, 8, 0, 0]} name="Renewed" />
                <Bar yAxisId="left" dataKey="churned" fill="#b91c3c" radius={[8, 8, 0, 0]} name="Churned" />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="retention_pct"
                  stroke="#d4af37"
                  strokeWidth={2.5}
                  fill="url(#retArea)"
                  name="Retention %"
                  dot={{ r: 4, fill: "#a87522" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Insight Summary" data-testid="retention-insights">
          <div className="col" style={{ gap: 14 }}>
            <div className="insight-tile" style={{ background: "linear-gradient(180deg, #e8f6ee, #d4efc2)", borderColor: "#c8e5b1" }}>
              <TrendingUp size={22} style={{ color: "var(--success)" }} />
              <div>
                <div className="small" style={{ fontWeight: 700, letterSpacing: "0.14em" }}>BULAN TERBAIK</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  {ret.best_month} · {ret.best_month_pct}%
                </div>
                <div className="small muted">Retention tertinggi 6 bulan terakhir</div>
              </div>
            </div>

            <div className="insight-tile" style={{ background: "linear-gradient(180deg, #fce8ec, #fbd6dd)", borderColor: "#f2c8d0" }}>
              <TrendingDown size={22} style={{ color: "var(--danger)" }} />
              <div>
                <div className="small" style={{ fontWeight: 700, letterSpacing: "0.14em" }}>PERLU PERHATIAN</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  {ret.worst_month} · {ret.worst_month_pct}%
                </div>
                <div className="small muted">Retention terendah — review harga & fasilitas</div>
              </div>
            </div>

            <div className="insight-tile" style={{ background: "linear-gradient(180deg, #f4ecff, #ece0ff)", borderColor: "#dccafd" }}>
              <Users size={22} style={{ color: "var(--royal)" }} />
              <div>
                <div className="small" style={{ fontWeight: 700, letterSpacing: "0.14em" }}>AVG. TENURE</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  {ret.avg_active_tenure_months} bulan
                </div>
                <div className="small muted">Rata-rata lama tinggal {ret.active_tenants} tenant aktif</div>
              </div>
            </div>

            <div className="insight-tile" style={{ background: "linear-gradient(180deg, #fbf5e6, #fdf1c6)", borderColor: "#f0dfa6" }}>
              <RefreshCw size={22} style={{ color: "var(--gold-deep)" }} />
              <div>
                <div className="small" style={{ fontWeight: 700, letterSpacing: "0.14em" }}>PIPELINE RENEWAL</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  {ret.total_renewed_actual} kontrak diperpanjang
                </div>
                <div className="small muted">Total sejak sistem aktif</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
