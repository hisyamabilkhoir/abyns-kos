import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTenants } from "../services/tenantService";
import { Card, Avatar, Badge, Skeleton, statusLabel, statusVariant } from "../components/UI";
import { currency } from "../services/api";

export default function Tenants() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    listTenants().then(setRows).catch(console.error);
  }, []);

  const filtered = (rows || []).filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.room_number.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Tenants</h1>
          <div className="sub">{rows ? `${rows.length} tenants` : "Loading…"} · payment health at a glance.</div>
        </div>
        <input
          className="search"
          placeholder="Search name or room…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid var(--line)", fontFamily: "inherit", minWidth: 260 }}
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
                  <th>Monthly Rent</th>
                  <th>Payment Status</th>
                  <th>Payment Health</th>
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
                    <td><Badge variant="success" dot>{statusLabel(t.status)}</Badge></td>
                    <td className="mono">{currency(t.rent || 0) || "—"}</td>
                    <td><Badge variant={statusVariant(t.payment_status)} dot>{statusLabel(t.payment_status)}</Badge></td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="health-bar" style={{ width: 80 }}>
                          <span style={{ width: `${t.payment_health}%` }} />
                        </div>
                        <div className="mono" style={{ fontWeight: 700 }}>{t.payment_health}</div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/tenants/${t.id}`} className="btn btn-ghost btn-sm">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
