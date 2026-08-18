import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../services/api";
import { X, Sparkles, TrendingDown, Copy } from "lucide-react";

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <b key={i} style={{ color: "var(--royal)" }}>
        {p.slice(2, -2)}
      </b>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function RetentionAdvisorModal({ worst, worstPct, onClose }) {
  const [text, setText] = useState("");
  const [state, setState] = useState("streaming"); // streaming | done | error
  const [copied, setCopied] = useState(false);
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
              if (event === "error") setState("error");
              else if (event === "done") { /* keep streaming state until reader done */ }
              else if (j.delta) setText((t) => t + j.delta);
            } catch {
              /* skip malformed line */
            }
          }
        }
        setState("done");
      } catch {
        setState("error");
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

        <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          {text && (
            <button className="btn btn-soft btn-sm" onClick={copy} data-testid="advisor-copy">
              <Copy size={12} /> {copied ? "Disalin!" : "Copy"}
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
