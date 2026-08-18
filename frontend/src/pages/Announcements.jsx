import { useEffect, useState } from "react";
import {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../services/announcementService";
import { Card, KpiCard, Badge, Skeleton, EmptyState } from "../components/UI";
import { Megaphone, Plus, X, Trash2, Users, Send, CheckCircle2 } from "lucide-react";

const PRIORITIES = [
  { key: "info", label: "Info", color: "info" },
  { key: "warning", label: "Warning", color: "warn" },
  { key: "urgent", label: "Urgent", color: "danger" },
];

export default function Announcements() {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [prio, setPrio] = useState("info");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => listAnnouncements().then(setRows).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!title.trim() || !msg.trim() || busy) return;
    setBusy(true);
    await createAnnouncement({ title: title.trim(), message: msg.trim(), priority: prio });
    setTitle("");
    setMsg("");
    setPrio("info");
    setOpen(false);
    setToast("Announcement terkirim ke semua tenant.");
    setTimeout(() => setToast(""), 3000);
    await load();
    setBusy(false);
  };

  const removeItem = async (id) => {
    await deleteAnnouncement(id);
    await load();
  };

  if (!rows) return <Skeleton h={320} />;

  const total = rows.length;
  const totalReads = rows.reduce((s, r) => s + (r.read_count || 0), 0);
  const totalRecipients = rows.reduce((s, r) => s + (r.total_recipients || 0), 0);
  const openRate = totalRecipients ? Math.round((totalReads / totalRecipients) * 100) : 0;

  return (
    <div className="fade-in">
      {toast && (
        <div className="paid-toast" data-testid="ann-toast">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      <div className="page-head">
        <div>
          <h1>Announcements</h1>
          <div className="sub">
            Kirim pengumuman ke semua tenant — muncul otomatis saat mereka buka portal.
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setOpen(true)}
          data-testid="new-announcement-btn"
        >
          <Plus size={16} /> New Announcement
        </button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KpiCard label="Total Sent" value={total} testid="ann-total" />
        <KpiCard
          tone="royal"
          label="Total Reads"
          value={totalReads}
          delta={`${totalRecipients} recipients`}
          accent="var(--success)"
          testid="ann-reads"
        />
        <KpiCard
          tone="gold"
          label="Open Rate"
          value={`${openRate}%`}
          delta="rata-rata semua pengumuman"
          accent="var(--success)"
          testid="ann-openrate"
        />
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Card title="Sent Announcements" data-testid="ann-list">
          {rows.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={26} />}
              title="Belum ada pengumuman."
              desc='Klik "New Announcement" untuk mulai broadcast.'
            />
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {rows.map((a) => {
                const pct = a.total_recipients
                  ? Math.round((a.read_count / a.total_recipients) * 100)
                  : 0;
                const p = PRIORITIES.find((x) => x.key === a.priority) || PRIORITIES[0];
                return (
                  <div key={a.id} className="ann-item" data-testid={`ann-item-${a.id}`}>
                    <div className="row between" style={{ marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <Badge variant={p.color} dot>
                          {p.label}
                        </Badge>
                        <span className="small muted">
                          {(a.created_at || "").slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                      <button
                        className="icon-btn"
                        onClick={() => removeItem(a.id)}
                        aria-label="Delete"
                        data-testid={`ann-del-${a.id}`}
                        style={{ width: 32, height: 32 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: "Fraunces, serif",
                        fontSize: 20,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {a.title}
                    </div>
                    <p className="muted" style={{ marginTop: 4, marginBottom: 12, fontSize: 14 }}>
                      {a.message}
                    </p>
                    <div className="row between" style={{ gap: 12 }}>
                      <div className="row small muted" style={{ gap: 6 }}>
                        <Users size={13} /> {a.read_count} of {a.total_recipients} sudah baca
                      </div>
                      <div className="small mono" style={{ fontWeight: 700 }}>
                        {pct}%
                      </div>
                    </div>
                    <div className="health-bar" style={{ marginTop: 6 }}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Preview: Tenant View">
          <div style={{ maxWidth: 380, margin: "0 auto" }}>
            <div className="ann-preview-shell">
              <div className="small muted" style={{ marginBottom: 10 }}>
                Ini yang tenant Anda lihat saat buka portal:
              </div>
              {rows.length === 0 ? (
                <div className="empty" style={{ padding: 20 }}>
                  <Megaphone size={22} style={{ color: "var(--muted)" }} />
                  <div className="small muted" style={{ marginTop: 6 }}>
                    Kirim pengumuman pertama untuk melihat preview.
                  </div>
                </div>
              ) : (
                <div className={`tenant-ann-banner priority-${rows[0].priority}`}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <Megaphone size={14} />
                    <div className="small" style={{ fontWeight: 700, letterSpacing: "0.14em" }}>
                      {(PRIORITIES.find((x) => x.key === rows[0].priority) || PRIORITIES[0]).label.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500 }}>
                    {rows[0].title}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 14, opacity: 0.9 }}>{rows[0].message}</div>
                </div>
              )}
            </div>

            <div className="small muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
              💡 Tenant akan melihat banner di atas dashboard mereka sampai mereka menandai
              &quot;Sudah dibaca&quot;. Delivery meter di sebelah kiri menunjukkan progress
              real-time.
            </div>
          </div>
        </Card>
      </div>

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="modal" data-testid="ann-modal">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 10 }}>
                <div className="mini-ico">
                  <Megaphone />
                </div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  Broadcast baru
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <label className="small muted">Judul</label>
            <input
              className="tl-input"
              placeholder='Misal: "Air mati Sabtu 14:00-16:00"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="ann-title"
            />

            <label className="small muted" style={{ marginTop: 10 }}>
              Pesan
            </label>
            <textarea
              className="tl-input"
              rows={4}
              placeholder="Detail lengkap yang perlu tenant tahu..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              data-testid="ann-message"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />

            <label className="small muted" style={{ marginTop: 10 }}>
              Prioritas
            </label>
            <div className="row" style={{ gap: 6, marginTop: 4 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  className="btn btn-sm"
                  onClick={() => setPrio(p.key)}
                  data-testid={`ann-prio-${p.key}`}
                  style={{
                    background: prio === p.key ? "var(--royal)" : "#fff",
                    color: prio === p.key ? "#fff" : "var(--ink-2)",
                    border: `1px solid ${prio === p.key ? "var(--royal)" : "var(--line)"}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="row" style={{ gap: 8, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={busy || !title.trim() || !msg.trim()}
                data-testid="ann-submit"
                style={{ flex: 1 }}
              >
                <Send size={14} /> {busy ? "Mengirim..." : "Broadcast Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
