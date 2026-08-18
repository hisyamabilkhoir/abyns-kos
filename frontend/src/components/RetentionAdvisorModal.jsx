import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../services/api";
import {
  runExitInterview,
  runLoyaltyProgram,
  runPreventiveMaintenance,
} from "../services/advisorService";
import {
  X,
  Sparkles,
  TrendingDown,
  Copy,
  MessageCircle,
  Gift,
  Wrench,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <b key={i} style={{ color: "var(--royal)" }}>{p.slice(2, -2)}</b>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
      return <i key={i}>{p.slice(1, -1)}</i>;
    return <span key={i}>{p}</span>;
  });
}

const ACTIONS = [
  {
    id: "exit_interview",
    Icon: MessageCircle,
    title: "Exit Interview",
    desc: "Kirim WhatsApp ke tenant yang churn — minta 1 kalimat feedback jujur.",
    color: "#1f8f5a",
    bg: "linear-gradient(180deg, #e8f6ee, #d4efc2)",
    border: "#c8e5b1",
    run: runExitInterview,
    successMsg: (r) => `WhatsApp terkirim ke ${r.sent_count} tenant churn.`,
  },
  {
    id: "loyalty_program",
    Icon: Gift,
    title: "Loyalty Program",
    desc: "Broadcast bonus voucher laundry + upgrade WiFi bagi yang renew H-7.",
    color: "var(--gold-deep)",
    bg: "linear-gradient(180deg, #fbf5e6, #fdf1c6)",
    border: "#f0dfa6",
    run: runLoyaltyProgram,
    successMsg: (r) => `Broadcast terkirim ke ${r.recipients} tenant aktif.`,
  },
  {
    id: "preventive_maintenance",
    Icon: Wrench,
    title: "Preventive Maintenance",
    desc: "Buat 3 tugas maintenance: AC, WiFi audit, plumbing check.",
    color: "var(--royal)",
    bg: "linear-gradient(180deg, #f4ecff, #ece0ff)",
    border: "#dccafd",
    run: runPreventiveMaintenance,
    successMsg: (r) => `${r.created_count} tugas maintenance dibuat.`,
  },
];

export default function RetentionAdvisorModal({ worst, worstPct, onClose }) {
  const [text, setText] = useState("");
  const [state, setState] = useState("streaming");
  const [copied, setCopied] = useState(false);
  const [runResults, setRunResults] = useState({});
  const [runningId, setRunningId] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/retention-advisor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) { setState("error"); return; }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() || "";
          for (const part of parts) {
            let event = "message";
            let data = "";
            for (const line of part.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) data += line.slice(5).trim();
            }
            if (!data) continue;
            try {
              const j = JSON.parse(data);
              if (event === "error") setState("error");
              else if (j.delta) setText((t) => t + j.delta);
            } catch { /* skip */ }
          }
        }
        setState("done");
      } catch { setState("error"); }
    })();
    return () => ctrl.abort();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  const runAction = async (a) => {
    setRunningId(a.id);
    try {
      const r = await a.run();
      setRunResults((s) => ({ ...s, [a.id]: { ok: true, text: a.successMsg(r) } }));
    } catch (e) {
      setRunResults((s) => ({
        ...s,
        [a.id]: { ok: false, text: e?.response?.data?.detail || "Gagal — coba lagi." },
      }));
    }
    setRunningId(null);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal advisor-modal" data-testid="advisor-modal">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            <div className="mini-ico" style={{ background: "#efe8f8", color: "var(--royal)" }}>
              <Sparkles />
            </div>
            <div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                AI Retention Advisor
              </div>
              <div className="small muted">
                Analisa churn <b>{worst}</b> · {worstPct}% retention
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" data-testid="advisor-close">
            <X size={16} />
          </button>
        </div>

        <div className="advisor-body" data-testid="advisor-body">
          {state === "error" ? (
            <div className="row" style={{ gap: 8, color: "var(--danger)" }}>
              <TrendingDown size={18} /> Gagal memuat analisa. Coba lagi.
            </div>
          ) : text ? (
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14.5 }}>
              {renderInline(text)}
              {state === "streaming" && <span className="advisor-cursor" />}
            </div>
          ) : (
            <div className="row" style={{ gap: 10 }}>
              <div className="qris-spinner" style={{ width: 24, height: 24, borderWidth: 3, margin: 0 }} />
              <div className="muted small">ABYNS AI sedang menganalisa...</div>
            </div>
          )}
        </div>

        {/* Action cards */}
        <div className="advisor-actions-label">
          <Sparkles size={12} /> AKSI SATU-KLIK
        </div>
        <div className="advisor-actions-grid" data-testid="advisor-actions">
          {ACTIONS.map((a) => {
            const res = runResults[a.id];
            const busy = runningId === a.id;
            return (
              <div
                key={a.id}
                className="advisor-action-card"
                style={{ background: a.bg, borderColor: a.border }}
              >
                <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <div
                    className="mini-ico"
                    style={{ background: "rgba(255,255,255,0.6)", color: a.color }}
                  >
                    <a.Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
                    <div className="small" style={{ opacity: 0.85, marginTop: 2, lineHeight: 1.45 }}>
                      {a.desc}
                    </div>
                  </div>
                </div>
                {res ? (
                  <div
                    className="row small"
                    style={{
                      gap: 6,
                      marginTop: 10,
                      color: res.ok ? "var(--success)" : "var(--danger)",
                      fontWeight: 600,
                    }}
                    data-testid={`advisor-result-${a.id}`}
                  >
                    <CheckCircle2 size={13} /> {res.text}
                  </div>
                ) : (
                  <button
                    className="btn btn-sm"
                    onClick={() => runAction(a)}
                    disabled={busy}
                    data-testid={`advisor-run-${a.id}`}
                    style={{
                      marginTop: 10,
                      background: a.color,
                      color: "#fff",
                      border: 0,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    {busy ? <Loader2 size={13} className="qris-rotate" /> : <Sparkles size={12} />}
                    {busy ? "Menjalankan..." : "Jalankan"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          {text && (
            <button className="btn btn-soft btn-sm" onClick={copy} data-testid="advisor-copy">
              <Copy size={12} /> {copied ? "Disalin!" : "Copy analisa"}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
