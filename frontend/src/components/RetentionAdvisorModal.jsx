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
  Copy,
  MessageCircle,
  Gift,
  Wrench,
  CheckCircle2,
  Loader2,
  AlertTriangle,
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
    desc: "Kirim WhatsApp ke tenant churn — minta 1 kalimat feedback.",
    color: "#1f8f5a",
    bg: "linear-gradient(180deg, #e8f6ee, #d4efc2)",
    border: "#c8e5b1",
    run: runExitInterview,
    successMsg: (r) => `WA terkirim ke ${r.sent_count} tenant.`,
  },
  {
    id: "loyalty_program",
    Icon: Gift,
    title: "Loyalty Program",
    desc: "Broadcast bonus voucher bagi yang renew H-7.",
    color: "var(--gold-deep)",
    bg: "linear-gradient(180deg, #fbf5e6, #fdf1c6)",
    border: "#f0dfa6",
    run: runLoyaltyProgram,
    successMsg: (r) => `Terkirim ke ${r.recipients} tenant aktif.`,
  },
  {
    id: "preventive_maintenance",
    Icon: Wrench,
    title: "Preventive Maintenance",
    desc: "Buat 3 tugas: AC, WiFi audit, plumbing.",
    color: "var(--royal)",
    bg: "linear-gradient(180deg, #f4ecff, #ece0ff)",
    border: "#dccafd",
    run: runPreventiveMaintenance,
    successMsg: (r) => `${r.created_count} tugas dibuat.`,
  },
];

export default function RetentionAdvisorModal({ worst, worstPct, onClose }) {
  const [text, setText] = useState("");
  const [state, setState] = useState("loading"); // loading | streaming | done | error
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
        if (!res.ok || !res.body) {
          setState("error");
          return;
        }
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
              if (event === "error") {
                setState("error");
              } else if (j.delta) {
                setText((t) => t + j.delta);
                setState((s) => (s === "loading" ? "streaming" : s));
              }
            } catch {
              /* skip malformed line */
            }
          }
        }
        setState((s) => (s === "error" ? s : "done"));
      } catch (e) {
        if (e?.name !== "AbortError") setState("error");
      }
    })();
    return () => ctrl.abort();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
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

  const showLoader = state === "loading" && !text;
  const showError = state === "error" && !text;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal advisor-modal" data-testid="advisor-modal">
        {/* HEADER */}
        <div className="row between" style={{ marginBottom: 14 }}>
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
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
            data-testid="advisor-close"
          >
            <X size={16} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="advisor-scroll">
          {/* ACTION CARDS — di atas */}
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
                  <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                    <div
                      className="mini-ico"
                      style={{
                        background: "rgba(255,255,255,0.65)",
                        color: a.color,
                        width: 28,
                        height: 28,
                      }}
                    >
                      <a.Icon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</div>
                      <div
                        className="small"
                        style={{ opacity: 0.85, marginTop: 2, lineHeight: 1.4, fontSize: 11.5 }}
                      >
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
                        fontSize: 11.5,
                      }}
                      data-testid={`advisor-result-${a.id}`}
                    >
                      <CheckCircle2 size={12} /> {res.text}
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
                        fontSize: 12,
                        padding: "8px 10px",
                      }}
                    >
                      {busy ? (
                        <Loader2 size={12} className="qris-rotate" />
                      ) : (
                        <Sparkles size={11} />
                      )}
                      {busy ? "Menjalankan..." : "Jalankan"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* CARD ANALISA AI — di bawah */}
          <div className="advisor-analysis-card" data-testid="advisor-body">
            <div className="advisor-analysis-head">
              <div className="row" style={{ gap: 6 }}>
                <Sparkles size={12} style={{ color: "var(--royal)" }} />
                <span
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--royal)",
                  }}
                >
                  Analisa ABYNS AI
                </span>
              </div>
              {state === "streaming" && (
                <span className="row small" style={{ gap: 6, color: "var(--muted)" }}>
                  <Loader2 size={12} className="qris-rotate" /> menganalisa...
                </span>
              )}
              {state === "done" && (
                <span
                  className="row small"
                  style={{ gap: 6, color: "var(--success)", fontWeight: 600 }}
                >
                  <CheckCircle2 size={12} /> selesai
                </span>
              )}
            </div>
            <div className="advisor-analysis-body">
              {showError ? (
                <div className="row" style={{ gap: 8, color: "var(--danger)" }}>
                  <AlertTriangle size={16} /> Gagal memuat analisa. Coba tutup dan buka lagi.
                </div>
              ) : showLoader ? (
                <div className="advisor-loader">
                  <div className="advisor-loader-line" style={{ width: "88%" }} />
                  <div className="advisor-loader-line" style={{ width: "72%" }} />
                  <div className="advisor-loader-line" style={{ width: "94%" }} />
                  <div className="advisor-loader-line" style={{ width: "58%" }} />
                  <div className="row" style={{ gap: 8, marginTop: 10, color: "var(--royal)" }}>
                    <Loader2 size={16} className="qris-rotate" />
                    <span className="small" style={{ fontWeight: 600 }}>
                      ABYNS AI sedang menganalisa data churn Anda...
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 14 }}>
                  {renderInline(text)}
                  {state === "streaming" && <span className="advisor-cursor" />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="row"
          style={{
            gap: 8,
            marginTop: 14,
            justifyContent: "flex-end",
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
          }}
        >
          {text && (
            <button
              className="btn btn-soft btn-sm"
              onClick={copy}
              data-testid="advisor-copy"
            >
              <Copy size={12} /> {copied ? "Disalin!" : "Copy analisa"}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={onClose}
            data-testid="advisor-done"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
