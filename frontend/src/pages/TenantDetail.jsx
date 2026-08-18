import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTenant } from "../services/tenantService";
import { Card, Avatar, Badge, Skeleton, statusLabel, statusVariant } from "../components/UI";
import { currency } from "../services/api";
import { ArrowLeft } from "lucide-react";

const TABS = ["Overview", "Billing", "Payment History", "Contract"];

export default function TenantDetail() {
  const { id } = useParams();
  const [t, setT] = useState(null);
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    getTenant(id).then(setT).catch(console.error);
  }, [id]);

  if (!t) return <Skeleton h={280} />;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <Link to="/tenants" className="small muted row" style={{ gap: 4, marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Tenants
          </Link>
          <div className="row" style={{ gap: 14 }}>
            <Avatar name={t.name} size="lg" />
            <div>
              <h1 style={{ margin: 0 }}>{t.name}</h1>
              <div className="row small muted" style={{ gap: 8 }}>
                <span>{t.room_number}</span> · <span>{t.email}</span> · <span>{t.phone}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 6 }}>
          <div className="small muted">Payment Health</div>
          <div className="row" style={{ gap: 10 }}>
            <div className="health-bar" style={{ width: 140 }}>
              <span style={{ width: `${t.payment_health}%` }} />
            </div>
            <span style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 500 }}>
              {t.payment_health}
              <span style={{ fontSize: 14, color: "var(--muted)" }}> /100</span>
            </span>
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((x) => (
          <button
            key={x}
            className="btn btn-sm"
            onClick={() => setTab(x)}
            data-testid={`tenant-tab-${x.toLowerCase().replace(/\s/g, "-")}`}
            style={{
              background: tab === x ? "var(--royal)" : "#fff",
              color: tab === x ? "#fff" : "var(--ink-2)",
              border: `1px solid ${tab === x ? "var(--royal)" : "var(--line)"}`,
            }}
          >
            {x}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid-2">
          <Card title="Personal Information">
            <div className="col" style={{ gap: 10 }}>
              <div className="row between"><span className="muted">Full Name</span><span>{t.name}</span></div>
              <div className="row between"><span className="muted">Email</span><span>{t.email}</span></div>
              <div className="row between"><span className="muted">Phone</span><span className="mono">{t.phone}</span></div>
              <div className="row between"><span className="muted">ID (masked)</span><span className="mono">***{(t.id_number || "").slice(-4)}</span></div>
              <div className="row between"><span className="muted">Move-in Date</span><span>{t.move_in_date}</span></div>
            </div>
          </Card>
          <Card title="Room & Contract">
            <div className="col" style={{ gap: 10 }}>
              <div className="row between"><span className="muted">Room</span><span className="mono" style={{ fontWeight: 700 }}>{t.room_number}</span></div>
              {t.contract && <>
                <div className="row between"><span className="muted">Monthly Rent</span><span className="mono">{currency(t.contract.monthly_rent)}</span></div>
                <div className="row between"><span className="muted">Deposit</span><span className="mono">{currency(t.contract.deposit)}</span></div>
                <div className="row between"><span className="muted">Start</span><span>{t.contract.start_date}</span></div>
                <div className="row between"><span className="muted">End</span><span>{t.contract.end_date}</span></div>
                <div className="row between"><span className="muted">Status</span><Badge variant="success" dot>{statusLabel(t.contract.status)}</Badge></div>
              </>}
            </div>
          </Card>
        </div>
      )}

      {tab === "Billing" && (
        <Card title="Recent Invoices">
          <table className="table">
            <thead><tr><th>Period</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {(t.invoices || []).slice(0, 8).map((i) => (
                <tr key={i.id}>
                  <td className="mono">{i.period}</td>
                  <td className="mono">{currency(i.amount)}</td>
                  <td>{i.due_date}</td>
                  <td><Badge variant={statusVariant(i.status)} dot>{statusLabel(i.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "Payment History" && (
        <Card title="Payments">
          <table className="table">
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>
              {(t.payments || []).slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td>{p.paid_at?.slice(0, 10)}</td>
                  <td className="mono">{currency(p.amount)}</td>
                  <td className="muted">{p.method}</td>
                  <td><Badge variant="success" dot>{statusLabel(p.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "Contract" && t.contract && (
        <Card title="Contract Details">
          <div className="grid-2">
            <div><div className="muted small">Start</div><div style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}>{t.contract.start_date}</div></div>
            <div><div className="muted small">End</div><div style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}>{t.contract.end_date}</div></div>
            <div><div className="muted small">Monthly Rent</div><div style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}>{currency(t.contract.monthly_rent)}</div></div>
            <div><div className="muted small">Deposit</div><div style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}>{currency(t.contract.deposit)}</div></div>
          </div>
        </Card>
      )}
    </div>
  );
}
