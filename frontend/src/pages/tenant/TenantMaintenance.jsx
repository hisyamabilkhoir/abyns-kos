import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listMyMaintenance, createMaintenance } from "../../services/tenantPortalService";
import { Card, Badge, Skeleton, statusLabel, statusVariant } from "../../components/UI";
import { Wrench, Plus, X, CheckCircle2 } from "lucide-react";

const PRIORITIES = ["low", "medium", "high"];

export default function TenantMaintenance() {
  const { id } = useParams();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [desc, setDesc] = useState("");
  const [prio, setPrio] = useState("medium");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => listMyMaintenance(id).then(setRows).catch(console.error);
  useEffect(() => { load(); }, [id]);

  const submit = async () => {
    if (!issue.trim() || busy) return;
    setBusy(true);
    await createMaintenance(id, { issue: issue.trim(), description: desc.trim(), priority: prio });
    setIssue("");
    setDesc("");
    setPrio("medium");
    setOpen(false);
    setToast("Laporan berhasil dikirim ke pemilik kos.");
    setTimeout(() => setToast(""), 3200);
    await load();
    setBusy(false);
  };

  if (!rows) return <Skeleton h={320} />;

  return (
    <div className="fade-in">
      {toast && <div className="paid-toast" data-testid="maint-toast"><CheckCircle2 size={18} /> {toast}</div>}

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 28 }}>Support & Maintenance</h1>
          <div className="sub">{rows.length} laporan Anda</div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)} data-testid="new-report-btn">
          <Plus size={16} /> Laporan Baru
        </button>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="empty">
            <Wrench size={26} style={{ color: "var(--royal)" }} />
            <h4>Belum ada laporan.</h4>
            <div>Tekan &ldquo;Laporan Baru&rdquo; untuk melaporkan masalah di kamar Anda.</div>
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {rows.map((m) => (
              <div key={m.id} className="maint-item" data-testid={`maint-item-${m.id}`}>
                <div className="row between" style={{ marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Badge variant={statusVariant(m.status)} dot>{statusLabel(m.status)}</Badge>
                    <Badge variant={statusVariant(m.priority)}>Prio {m.priority}</Badge>
                  </div>
                  <div className="small muted">
                    {(m.reported_at || "").slice(0, 10)}
                  </div>
                </div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500 }}>
                  {m.issue}
                </div>
                {m.description && <div className="small muted" style={{ marginTop: 4 }}>{m.description}</div>}
                <div className="small muted" style={{ marginTop: 6 }}>
                  {m.technician ? `Ditugaskan ke: ${m.technician}` : "Menunggu teknisi ditugaskan"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                Laporan Baru
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close" data-testid="modal-close">
                <X size={16} />
              </button>
            </div>

            <label className="small muted">Masalah</label>
            <input
              className="tl-input"
              placeholder="AC tidak dingin, keran bocor, dsb."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              data-testid="maint-issue"
            />

            <label className="small muted" style={{ marginTop: 10 }}>Detail (opsional)</label>
            <textarea
              className="tl-input"
              rows={3}
              placeholder="Sudah berapa lama? Kapan mulai terjadi?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              data-testid="maint-desc"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />

            <label className="small muted" style={{ marginTop: 10 }}>Prioritas</label>
            <div className="row" style={{ gap: 6, marginTop: 4 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  className="btn btn-sm"
                  onClick={() => setPrio(p)}
                  data-testid={`prio-${p}`}
                  style={{
                    background: prio === p ? "var(--royal)" : "#fff",
                    color: prio === p ? "#fff" : "var(--ink-2)",
                    border: `1px solid ${prio === p ? "var(--royal)" : "var(--line)"}`,
                    textTransform: "capitalize",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="row" style={{ gap: 8, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={busy || !issue.trim()}
                data-testid="maint-submit"
                style={{ flex: 1 }}
              >
                {busy ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
