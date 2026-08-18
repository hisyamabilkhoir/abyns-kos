import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTenants } from "../services/tenantService";
import { renewContract } from "../services/contractService";
import { Card, Avatar, Badge, Skeleton, statusLabel, statusVariant } from "../components/UI";
import { currency } from "../services/api";
import { RefreshCw, CalendarClock, CheckCircle2, X } from "lucide-react";

function ContractCountdown({ days, status }) {
  if (days == null) return <span className="small muted">—</span>;
  const cfg =
    status === "expired"
      ? { color: "var(--danger)", bg: "#fce8ec", label: `Expired ${Math.abs(days)}d ago` }
      : status === "expiring_soon"
        ? { color: "var(--danger)", bg: "#fce8ec", label: `${days}d left` }
        : status === "expiring"
          ? { color: "var(--warn)", bg: "#fbf1d6", label: `${days}d left` }
          : { color: "var(--success)", bg: "#e8f6ee", label: `${days}d left` };
  return (
    <div
      className="mono"
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <CalendarClock size={11} /> {cfg.label}
    </div>
  );
}

export default function Tenants() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [renewT, setRenewT] = useState(null);
  const [months, setMonths] = useState(12);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => listTenants().then(setRows).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const submitRenew = async () => {
    if (!renewT?.contract?.id || busy) return;
    setBusy(true);
    await renewContract(renewT.contract.id, months);
    setToast(`Kontrak ${renewT.name} diperpanjang ${months} bulan.`);
    setTimeout(() => setToast(""), 3500);
    setRenewT(null);
    setMonths(12);
    await load();
    setBusy(false);
  };

  const filtered = (rows || []).filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.room_number.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fade-in">
      {toast && (
        <div className="paid-toast" data-testid="renew-toast">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      <div className="page-head">
        <div>
          <h1>Tenants</h1>
          <div className="sub">
            {rows ? `${rows.length} tenants` : "Loading…"} · contract countdown & payment health.
          </div>
        </div>
        <input
          className="search"
          placeholder="Search name or room…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid var(--line)",
            fontFamily: "inherit",
            minWidth: 260,
          }}
          data-testid="tenant-search"
        />
      </div>

      <Card>
        {!rows ? (
          <Skeleton h={280} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" data-testid="tenants-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Contract</th>
                  <th>Move-out</th>
                  <th>Monthly Rent</th>
                  <th>Payment</th>
                  <th>Health</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} data-testid={`tenant-row-${t.id}`}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={t.name} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          <div className="small muted">{t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{t.room_number}</td>
                    <td>
                      <Badge variant="success" dot>
                        {statusLabel(t.status)}
                      </Badge>
                    </td>
                    <td>
                      <div className="col" style={{ gap: 4 }}>
                        <ContractCountdown days={t.contract_days_remaining} status={t.contract_status} />
                        <div className="small muted">{t.contract_end_date || "—"}</div>
                      </div>
                    </td>
                    <td className="mono">
                      {t.contract?.monthly_rent ? currency(t.contract.monthly_rent) : "—"}
                    </td>
                    <td>
                      <Badge variant={statusVariant(t.payment_status)} dot>
                        {statusLabel(t.payment_status)}
                      </Badge>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="health-bar" style={{ width: 60 }}>
                          <span style={{ width: `${t.payment_health}%` }} />
                        </div>
                        <div className="mono" style={{ fontWeight: 700 }}>{t.payment_health}</div>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        {t.contract?.id &&
                          (t.contract_status === "expiring_soon" ||
                            t.contract_status === "expiring" ||
                            t.contract_status === "expired") && (
                            <button
                              className="btn btn-gold btn-sm"
                              onClick={() => setRenewT(t)}
                              data-testid={`renew-${t.id}`}
                            >
                              <RefreshCw size={12} /> Renew
                            </button>
                          )}
                        <Link to={`/tenants/${t.id}`} className="btn btn-ghost btn-sm">
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {renewT && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setRenewT(null)}
        >
          <div className="modal" data-testid="renew-modal">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 10 }}>
                <div
                  className="mini-ico"
                  style={{ background: "#fbf1d6", color: "var(--gold-deep)" }}
                >
                  <RefreshCw />
                </div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  Renew contract
                </div>
              </div>
              <button className="icon-btn" onClick={() => setRenewT(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              <Avatar name={renewT.name} />
              <div>
                <div style={{ fontWeight: 600 }}>{renewT.name}</div>
                <div className="small muted">
                  Kamar {renewT.room_number} · berakhir {renewT.contract_end_date}
                </div>
              </div>
            </div>

            <label className="small muted">Perpanjang berapa bulan?</label>
            <div className="row" style={{ gap: 6, marginTop: 6 }}>
              {[3, 6, 12, 24].map((m) => (
                <button
                  key={m}
                  className="btn btn-sm"
                  onClick={() => setMonths(m)}
                  data-testid={`renew-months-${m}`}
                  style={{
                    background: months === m ? "var(--royal)" : "#fff",
                    color: months === m ? "#fff" : "var(--ink-2)",
                    border: `1px solid ${months === m ? "var(--royal)" : "var(--line)"}`,
                  }}
                >
                  {m} bln
                </button>
              ))}
            </div>

            <div className="qris-help" style={{ marginTop: 14 }}>
              <CalendarClock size={16} style={{ color: "var(--gold-deep)", flexShrink: 0 }} />
              <div>
                Kontrak akan diperpanjang <b>{months} bulan</b> dari{" "}
                {renewT.contract_days_remaining >= 0 ? "tanggal berakhir" : "hari ini"}. Tarif
                bulanan{" "}
                {renewT.contract?.monthly_rent ? currency(renewT.contract.monthly_rent) : "—"}{" "}
                dipertahankan.
              </div>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setRenewT(null)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={submitRenew}
                disabled={busy}
                data-testid="renew-confirm"
                style={{ flex: 1 }}
              >
                {busy ? "Memperpanjang..." : `Perpanjang ${months} Bulan`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
