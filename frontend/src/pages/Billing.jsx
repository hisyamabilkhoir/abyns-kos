import { useEffect, useState } from "react";
import { listInvoices } from "../services/billingService";
import { remindersHistory, remindersPreview, sendReminder } from "../services/reminderService";
import { Card, KpiCard, Badge, Skeleton, Avatar, statusLabel, statusVariant } from "../components/UI";
import { currency } from "../services/api";
import { MessageCircle, Send, CheckCircle2, AlertTriangle, Clock, X } from "lucide-react";

const REMINDER_TAG = {
  "H-2": { label: "H-2", variant: "info", desc: "2 hari sebelum" },
  "H0": { label: "HARI INI", variant: "warn", desc: "hari jatuh tempo" },
  "H+2": { label: "H+2", variant: "danger", desc: "2 hari overdue" },
  manual: { label: "MANUAL", variant: "neutral", desc: "manual" },
};

export default function Billing() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [remHist, setRemHist] = useState(null);
  const [preview, setPreview] = useState([]);
  const [confirmInv, setConfirmInv] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    const [invs, hist, prev] = await Promise.all([
      listInvoices({ current: true }),
      remindersHistory(),
      remindersPreview(),
    ]);
    setRows(invs);
    setRemHist(hist);
    setPreview(prev);
  };
  useEffect(() => {
    load().catch(console.error);
  }, []);

  const sendNow = async () => {
    if (!confirmInv || sending) return;
    setSending(true);
    try {
      const res = await sendReminder(confirmInv.id);
      if (res.skipped) {
        setToast({ type: "warn", msg: `Reminder untuk ${confirmInv.tenant_name} sudah dikirim hari ini.` });
      } else if (res.ok) {
        setToast({ type: "success", msg: `WhatsApp terkirim ke ${confirmInv.tenant_name} 🎉` });
      } else {
        setToast({
          type: "error",
          msg: `Gagal: ${res.provider?.response?.reason || res.provider?.error || "unknown"}`,
        });
      }
      await load();
    } catch (e) {
      setToast({ type: "error", msg: e?.response?.data?.detail || e.message });
    }
    setConfirmInv(null);
    setSending(false);
    setTimeout(() => setToast(null), 4200);
  };

  if (!rows || !remHist) return <Skeleton h={340} />;

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
  const previewMap = Object.fromEntries(preview.map((p) => [p.invoice_id, p]));

  return (
    <div className="fade-in">
      {toast && (
        <div
          className={`paid-toast ${toast.type === "error" ? "toast-error" : toast.type === "warn" ? "toast-warn" : ""}`}
          data-testid="reminder-toast"
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {toast.msg}
        </div>
      )}

      <div className="page-head">
        <div>
          <h1>Billing</h1>
          <div className="sub">
            {rows.length} invoice · {remHist.today_count} reminder terkirim hari ini
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Total Billing" value={currency(totals.total)} />
        <KpiCard label="Paid" value={currency(totals.paid)} delta="Collected" accent="var(--success)" />
        <KpiCard label="Pending" value={currency(totals.pending)} delta="Awaiting" accent="var(--warn)" />
        <KpiCard
          label="Overdue"
          value={currency(totals.overdue)}
          delta="Action needed"
          accent="var(--danger)"
          tone="royal"
        />
      </div>

      {/* WhatsApp Reminder Panel */}
      <Card
        style={{ marginTop: 20 }}
        title="WhatsApp Auto Reminder"
        data-testid="reminder-panel"
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Badge variant="success" dot>
              Fonnte aktif
            </Badge>
            <Badge variant="info">Cron 09:00 WIB</Badge>
          </div>
        }
      >
        <div className="grid-3" style={{ gap: 16 }}>
          <div>
            <div className="small muted" style={{ marginBottom: 8 }}>Antrian hari ini</div>
            {preview.length === 0 ? (
              <div className="empty" style={{ padding: 12 }}>
                <CheckCircle2 size={22} style={{ color: "var(--success)" }} />
                <h4 style={{ margin: "4px 0" }}>Tidak ada yang perlu diingatkan.</h4>
                <div className="small muted">Semua tenant sudah tepat waktu.</div>
              </div>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {preview.slice(0, 5).map((p) => {
                  const tag = REMINDER_TAG[p.reminder_type] || REMINDER_TAG.manual;
                  return (
                    <div key={p.invoice_id} className="reminder-preview-row">
                      <Avatar name={p.tenant_name} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.tenant_name}</div>
                        <div className="small muted">
                          {p.room_number} · {currency(p.amount)}
                        </div>
                      </div>
                      {p.already_sent_today ? (
                        <Badge variant="success" dot>Terkirim</Badge>
                      ) : (
                        <Badge variant={tag.variant} dot>
                          {tag.label}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="small muted" style={{ marginBottom: 8 }}>Cara kerja</div>
            <div className="col" style={{ gap: 8 }}>
              {[
                ["H-2", "2 hari sebelum jatuh tempo", "info"],
                ["H", "Pada hari jatuh tempo", "warn"],
                ["H+2", "2 hari setelah terlambat", "danger"],
              ].map(([t, d, v]) => (
                <div key={t} className="row" style={{ gap: 10, padding: "6px 0" }}>
                  <Badge variant={v} dot>{t}</Badge>
                  <span className="small">{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="small muted" style={{ marginBottom: 8 }}>Riwayat terkirim</div>
            {remHist.history.length === 0 ? (
              <div className="empty" style={{ padding: 12 }}>
                <Clock size={20} style={{ color: "var(--muted)" }} />
                <div className="small muted">Belum ada reminder terkirim.</div>
              </div>
            ) : (
              <div className="col" style={{ gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {remHist.history.slice(0, 8).map((h) => (
                  <div key={h.id} className="reminder-history-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {h.tenant_name}
                      </div>
                      <div className="small muted">
                        {(h.sent_at || "").slice(11, 16)} · {(REMINDER_TAG[h.reminder_type] || REMINDER_TAG.manual).label}
                      </div>
                    </div>
                    <Badge variant={h.status === "sent" ? "success" : "danger"} dot>
                      {h.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card
        style={{ marginTop: 20 }}
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
                <th>Invoice</th>
                <th>Tenant</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const prev = previewMap[i.id];
                const canRemind = i.status !== "paid";
                return (
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
                    <td>
                      {i.due_date}{" "}
                      <span className="small muted">
                        {i.days_diff > 0
                          ? `(${i.days_diff}d)`
                          : i.days_diff === 0
                            ? "(today)"
                            : `(${Math.abs(i.days_diff)}d late)`}
                      </span>
                    </td>
                    <td>
                      <div className="col" style={{ gap: 4, alignItems: "flex-start" }}>
                        <Badge variant={statusVariant(i.status)} dot>
                          {statusLabel(i.status)}
                        </Badge>
                        {prev?.already_sent_today && (
                          <Badge variant="success">✓ Reminded today</Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      {canRemind ? (
                        <button
                          className="btn btn-soft btn-sm"
                          onClick={() => setConfirmInv(i)}
                          data-testid={`remind-btn-${i.id}`}
                          title="Kirim WhatsApp reminder"
                        >
                          <MessageCircle size={13} /> Remind
                        </button>
                      ) : (
                        <span className="small muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {confirmInv && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setConfirmInv(null)}
        >
          <div className="modal" data-testid="reminder-modal">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 10 }}>
                <div className="mini-ico" style={{ background: "#e8f6ee", color: "var(--success)" }}>
                  <MessageCircle />
                </div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  Kirim WhatsApp Reminder
                </div>
              </div>
              <button className="icon-btn" onClick={() => setConfirmInv(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="wa-preview">
              <div className="wa-header">
                <Avatar name={confirmInv.tenant_name} size="sm" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{confirmInv.tenant_name}</div>
                  <div className="small muted">Preview WhatsApp</div>
                </div>
              </div>
              <div className="wa-bubble">
                Halo {(confirmInv.tenant_name || "").split(" ")[0]}! 👋 Ini ABYNS KOS.
                {"\n\n"}Tagihan kamar <b>{confirmInv.room_number}</b> periode <b>{confirmInv.period}</b>:
                {"\n"}💰 {currency(confirmInv.amount)}
                {"\n"}📅 Jatuh tempo <b>{confirmInv.due_date}</b>
                {"\n\n"}
                {confirmInv.status === "overdue"
                  ? "🙏 Sudah terlambat — mohon segera dilunasi"
                  : confirmInv.days_diff === 0
                    ? "⚠️ Hari ini adalah tanggal jatuh tempo"
                    : "⏰ Segera bayar sebelum jatuh tempo"}
                {"\n\n"}Bayar cepat via QRIS di portal ABYNS.{"\n\n"}Terima kasih 🙏
              </div>
            </div>

            <div className="small muted" style={{ marginTop: 12 }}>
              📱 Dikirim ke nomor terdaftar tenant via Fonnte WhatsApp API. Idempotent per hari — tidak akan dobel.
            </div>

            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmInv(null)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={sendNow}
                disabled={sending}
                data-testid="reminder-confirm"
                style={{ flex: 1 }}
              >
                <Send size={14} /> {sending ? "Mengirim..." : "Kirim Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
