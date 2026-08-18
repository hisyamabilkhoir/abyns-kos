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
} from "recharts";
import { getFinanceSummary, listExpenses } from "../services/financeService";
import { Card, KpiCard, Badge, Skeleton } from "../components/UI";
import { currency, compact } from "../services/api";

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

  useEffect(() => {
    Promise.all([getFinanceSummary(), listExpenses()]).then(([a, b]) => {
      setSum(a);
      setExp(b);
    });
  }, []);

  if (!sum || !exp) return <Skeleton h={340} />;

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
    </div>
  );
}
