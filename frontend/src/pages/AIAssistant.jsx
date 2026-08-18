import { useEffect, useRef, useState } from "react";
import { streamAiChat } from "../services/aiService";
import { Card } from "../components/UI";
import { Sparkles, Send, RotateCcw } from "lucide-react";

const SUGGESTIONS = [
  "Siapa yang belum bayar bulan ini?",
  "Kenapa revenue saya turun?",
  "Kamar mana yang paling lama kosong?",
  "Apa yang harus saya prioritaskan hari ini?",
  "Berapa biaya maintenance bulan ini?",
  "Ringkas kesehatan bisnis saya.",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Halo Pak Adi 👋 Saya ABYNS AI. Tanyakan apa saja tentang property Anda — occupancy, tagihan, maintenance, atau revenue. Saya akan bantu menganalisa dan memberi rekomendasi.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "ai", text: "", pending: true }]);

    await streamAiChat({
      message: q,
      sessionId: sessionRef.current,
      onSession: (sid) => (sessionRef.current = sid),
      onDelta: (chunk) => {
        setMessages((m) => {
          const arr = [...m];
          const last = arr[arr.length - 1];
          if (last?.role === "ai") arr[arr.length - 1] = { ...last, text: (last.text || "") + chunk, pending: false };
          return arr;
        });
      },
      onError: (e) => {
        setMessages((m) => {
          const arr = [...m];
          arr[arr.length - 1] = { role: "ai", text: `⚠️ ${e.message || "AI error"}. Coba ulangi.` };
          return arr;
        });
      },
      onDone: () => setBusy(false),
    });
    setBusy(false);
  };

  const reset = () => {
    sessionRef.current = null;
    setMessages([{ role: "ai", text: "Percakapan baru dimulai. Silakan tanyakan apa saja tentang property Anda." }]);
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="row" style={{ gap: 10 }}>
            <div className="brand-mark" style={{ width: 40, height: 40 }}><Sparkles size={20} /></div>
            <div>
              <h1 style={{ margin: 0 }}>ABYNS AI</h1>
              <div className="sub">Your property intelligence assistant.</div>
            </div>
          </div>
        </div>
        <button className="btn btn-soft btn-sm" onClick={reset} data-testid="ai-reset">
          <RotateCcw size={14} /> New chat
        </button>
      </div>

      <div className="chat-shell">
        <aside className="chat-side">
          <div className="card-title" style={{ marginBottom: 10 }}>Suggested Prompts</div>
          <div className="col" style={{ gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)} data-testid={`ai-suggest-${s.slice(0, 12)}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="card" style={{ marginTop: 20, padding: 14, background: "linear-gradient(180deg, #f4ecff, #ece0ff)" }}>
            <div className="card-title" style={{ marginBottom: 6 }}>Powered by</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500 }}>Gemini 3 Flash</div>
            <div className="small muted">Real-time streaming · Contextual insight dari data property Anda.</div>
          </div>
        </aside>

        <div className="chat-main">
          <div ref={bodyRef} className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`} data-testid={`msg-${m.role}-${i}`}>
                {m.role === "ai" && (
                  <div className="ai-eyebrow" style={{ color: "var(--gold-deep)", marginBottom: 8 }}>
                    <span className="pulse" style={{ background: "var(--gold-deep)" }} /> ABYNS AI
                  </div>
                )}
                {m.pending && !m.text ? (
                  <div className="row" style={{ gap: 6 }}>
                    <span className="skel" style={{ width: 10, height: 10, borderRadius: "50%" }} />
                    <span className="skel" style={{ width: 10, height: 10, borderRadius: "50%", animationDelay: "0.1s" }} />
                    <span className="skel" style={{ width: 10, height: 10, borderRadius: "50%", animationDelay: "0.2s" }} />
                  </div>
                ) : (
                  m.text
                )}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              placeholder="Tanya sesuatu tentang property Anda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={busy}
              data-testid="ai-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => send()}
              disabled={busy || !input.trim()}
              data-testid="ai-send"
            >
              <Send size={14} /> {busy ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
