import { useEffect, useState } from "react";
import { listMaintenance } from "../services/maintenanceService";
import { Card, KpiCard, Badge, Skeleton, statusLabel, statusVariant } from "../components/UI";
import { Wrench } from "lucide-react";

export default function Maintenance() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    listMaintenance().then(setRows).catch(console.error);
  }, []);

  if (!rows) return <Skeleton h={340} />;

  const total = rows.length;
  const inProg = rows.filter((r) => r.status === "in_progress").length;
  const waiting = rows.filter((r) => r.status === "waiting").length;
  const done = rows.filter((r) => r.status === "completed").length;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Maintenance</h1>
          <div className="sub">Alur kerja perbaikan dari laporan ke selesai.</div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Total Reports" value={total} />
        <KpiCard label="In Progress" value={inProg} delta="Sedang berjalan" accent="var(--info)" tone="royal" />
        <KpiCard label="Waiting" value={waiting} delta="Belum ditugaskan" accent="var(--warn)" />
        <KpiCard label="Completed" value={done} delta="Bulan ini" accent="var(--success)" />
      </div>

      <div className="grid-3" style={{ marginTop: 20 }}>
        {["waiting", "in_progress", "completed"].map((col) => (
          <Card key={col}
            title={statusLabel(col)}
            actions={<Badge variant={statusVariant(col)} dot>{rows.filter((r) => r.status === col).length}</Badge>}
            data-testid={`maint-col-${col}`}
          >
            <div className="col" style={{ gap: 10 }}>
              {rows.filter((r) => r.status === col).length === 0 && (
                <div className="muted small" style={{ padding: 10 }}>
                  <Wrench size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                  Everything looks good.
                </div>
              )}
              {rows.filter((r) => r.status === col).slice(0, 6).map((m) => (
                <div key={m.id} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--line)", background: "#fff" }}>
                  <div className="row between">
                    <div className="mono" style={{ fontWeight: 700 }}>{m.room_number}</div>
                    <Badge variant={statusVariant(m.priority)}>Prio {m.priority}</Badge>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{m.issue}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {m.technician ? `Tech: ${m.technician}` : "No technician assigned"}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
