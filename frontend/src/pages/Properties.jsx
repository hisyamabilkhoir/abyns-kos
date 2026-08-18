import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProperties } from "../services/propertyService";
import { Card, Badge, Skeleton } from "../components/UI";
import { currency } from "../services/api";
import { MapPin, ArrowRight, Plus } from "lucide-react";

export default function Properties() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    listProperties().then(setRows).catch(console.error);
  }, []);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Properties</h1>
          <div className="sub">Kelola semua properti kos Anda dalam satu tempat.</div>
        </div>
        <button className="btn btn-primary" data-testid="add-property-btn">
          <Plus size={16} /> Add Property
        </button>
      </div>

      <div className="grid-3">
        {!rows &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton h={20} w="60%" />
              <div style={{ height: 12 }} />
              <Skeleton h={14} w="80%" />
              <div style={{ height: 20 }} />
              <Skeleton h={40} />
            </div>
          ))}

        {rows &&
          rows.map((p) => {
            const occ = p.total_rooms ? Math.round((p.occupied / p.total_rooms) * 100) : 0;
            return (
              <Card key={p.id} hoverable data-testid={`property-card-${p.id}`}>
                <div className="row between">
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                    {p.name}
                  </div>
                  <Badge variant="gold" dot>Active</Badge>
                </div>
                <div className="row small muted" style={{ gap: 6, marginTop: 4 }}>
                  <MapPin size={13} /> {p.address}
                </div>

                <div className="row" style={{ gap: 10, marginTop: 20 }}>
                  <div className="kpi royal" style={{ padding: 12, flex: 1 }}>
                    <div className="label">Occupancy</div>
                    <div className="value" style={{ fontSize: 22 }}>{occ}%</div>
                  </div>
                  <div className="kpi gold" style={{ padding: 12, flex: 1 }}>
                    <div className="label">Revenue</div>
                    <div className="value" style={{ fontSize: 22 }}>
                      {currency(p.monthly_revenue)}
                    </div>
                  </div>
                </div>

                <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <Badge variant="info">{p.total_rooms} rooms</Badge>
                  <Badge variant="success" dot>{p.occupied} occupied</Badge>
                  <Badge variant="gold" dot>{p.available} available</Badge>
                  <Badge variant="danger" dot>{p.maintenance} maint</Badge>
                </div>

                <Link
                  to={`/properties/${p.id}`}
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 16 }}
                  data-testid={`view-property-${p.id}`}
                >
                  View Property <ArrowRight size={14} />
                </Link>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
