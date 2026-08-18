import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProperty } from "../services/propertyService";
import { Card, Badge, KpiCard, Skeleton, statusLabel } from "../components/UI";
import { currency } from "../services/api";
import { MapPin, ArrowLeft } from "lucide-react";

const TABS = ["Overview", "Rooms", "Tenants", "Maintenance", "Finance"];

export default function PropertyDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    getProperty(id).then(setData).catch(console.error);
  }, [id]);

  if (!data) return <Skeleton h={220} />;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <Link to="/properties" className="small muted row" style={{ gap: 4, marginBottom: 6 }}>
            <ArrowLeft size={14} /> Back to Properties
          </Link>
          <h1>{data.name}</h1>
          <div className="row small muted" style={{ gap: 6 }}>
            <MapPin size={13} /> {data.address}
          </div>
        </div>
        <Badge variant="gold" dot>Active</Badge>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Total Rooms" value={data.total_rooms} />
        <KpiCard label="Occupied" value={data.occupied} delta={`${Math.round((data.occupied / data.total_rooms) * 100)}%`} accent="var(--success)" />
        <KpiCard label="Available" value={data.available} />
        <KpiCard label="Maintenance" value={data.maintenance} />
      </div>

      <div className="row" style={{ gap: 6, margin: "20px 0 16px", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`tab-${t.toLowerCase()}`}
            className="btn btn-sm"
            style={{
              background: tab === t ? "var(--royal)" : "#fff",
              color: tab === t ? "#fff" : "var(--ink-2)",
              border: `1px solid ${tab === t ? "var(--royal)" : "var(--line)"}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Rooms" && (
        <Card title="All Rooms">
          <div className="room-grid">
            {data.rooms
              .slice()
              .sort((a, b) => a.number.localeCompare(b.number))
              .map((r) => (
                <div key={r.id} className={`room ${r.status}`} data-testid={`room-${r.number}`}>
                  <div className="row between">
                    <div className="num">{r.number}</div>
                    <Badge
                      variant={r.status === "occupied" ? "success" : r.status === "available" ? "gold" : "danger"}
                      dot
                    >
                      {statusLabel(r.status)}
                    </Badge>
                  </div>
                  <div className="small muted" style={{ marginTop: 8 }}>
                    {currency(r.monthly_rent)}/mo
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {tab === "Overview" && (
        <div className="grid-2">
          <Card title="Property Summary">
            <div className="col" style={{ gap: 12 }}>
              <div className="row between">
                <span className="muted">Address</span>
                <span>{data.address}</span>
              </div>
              <div className="row between">
                <span className="muted">City</span>
                <span>{data.city}</span>
              </div>
              <div className="row between">
                <span className="muted">Owner</span>
                <span>Pak Adi</span>
              </div>
              <div className="row between">
                <span className="muted">Occupancy Rate</span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {Math.round((data.occupied / data.total_rooms) * 100)}%
                </span>
              </div>
            </div>
          </Card>
          <Card title="Quick Actions">
            <div className="col" style={{ gap: 10 }}>
              <Link to="/tenants" className="btn btn-soft">View Tenants →</Link>
              <Link to="/billing" className="btn btn-soft">View Billing →</Link>
              <Link to="/maintenance" className="btn btn-soft">Maintenance Queue →</Link>
              <Link to="/ai" className="btn btn-primary">Ask ABYNS AI →</Link>
            </div>
          </Card>
        </div>
      )}

      {tab === "Tenants" && (
        <Card title="Tenants (redirect)">
          <p className="muted">See the full <Link to="/tenants" style={{ color: "var(--royal)", fontWeight: 600 }}>Tenants directory →</Link></p>
        </Card>
      )}
      {tab === "Maintenance" && (
        <Card title="Maintenance">
          <p className="muted"><Link to="/maintenance" style={{ color: "var(--royal)", fontWeight: 600 }}>Open Maintenance workspace →</Link></p>
        </Card>
      )}
      {tab === "Finance" && (
        <Card title="Finance">
          <p className="muted"><Link to="/finance" style={{ color: "var(--royal)", fontWeight: 600 }}>Open Finance workspace →</Link></p>
        </Card>
      )}
    </div>
  );
}
