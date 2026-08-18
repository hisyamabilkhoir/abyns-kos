import { useEffect, useState } from "react";
import { listInvoices } from "../services/billingService";
import { Card, KpiCard, Badge, Skeleton, Avatar, statusLabel, statusVariant } from "../components/UI";
import { currency } from "../services/api";

export default function Billing() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    listInvoices({ current: true }).then(setRows).catch(console.error);
  }, []);

  if (!rows) return <Skeleton h={340} />;

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.amount;
      if (r.status === "paid") acc.paid += r.amount;
      if (r.status === "pending") acc.pending += r.amount;
      if (r.status === "overdue") acc.overdue += r.amount;
      return acc;
    },
    { total: 0, paid: 0, pending: 0, overdue: 0 }
  );

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Billing</h1>
          <div className="sub">Semua invoice bulan ini · {rows.length} total.</div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Total Billing" value={currency(totals.total)} />
        <KpiCard label="Paid" value={currency(totals.paid)} delta="Collected" accent="var(--success)" />
        <KpiCard label="Pending" value={currency(totals.pending)} delta="Awaiting" accent="var(--warn)" />
        <KpiCard label="Overdue" value={currency(totals.overdue)} delta="Action needed" accent="var(--danger)" tone="royal" />
      </div>

      <Card style={{ marginTop: 20 }}
        title="Invoices"
        actions={
          <div className="row" style={{ gap: 6 }}>
            {["all", "paid", "pending", "overdue"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                data-testid={`billing-filter-${f}`}
                className="btn btn-sm"
                style={{
                  background: filter === f ? "var(--royal)" : "#fff",
                  color: filter === f ? "#fff" : "var(--ink-2)",
                  border: `1px solid ${filter === f ? "var(--royal)" : "var(--line)"}`,
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table className="table" data-testid="invoices-table">
            <thead>
              <tr>
                <th>Invoice</th><th>Tenant</th><th>Period</th><th>Amount</th><th>Due Date</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td className="mono small">#{i.id.slice(0, 6).toUpperCase()}</td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <Avatar name={i.tenant_name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{i.tenant_name}</div>
                        <div className="small muted">{i.room_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{i.period}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{currency(i.amount)}</td>
                  <td>{i.due_date} <span className="small muted">
                    {i.days_diff > 0 ? `(${i.days_diff}d)` : i.days_diff === 0 ? "(today)" : `(${Math.abs(i.days_diff)}d late)`}
                  </span></td>
                  <td><Badge variant={statusVariant(i.status)} dot>{statusLabel(i.status)}</Badge></td>
                  <td><button className="btn btn-ghost btn-sm">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
