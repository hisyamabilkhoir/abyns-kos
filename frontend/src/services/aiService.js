import { API_BASE } from "./api";

/**
 * Stream chat response via fetch + SSE-like parsing.
 * onDelta(text), onDone(), onError(err), onSession(sid)
 */
export async function streamAiChat({ message, sessionId, onDelta, onDone, onError, onSession }) {
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!res.ok || !res.body) {
      onError?.(new Error(`HTTP ${res.status}`));
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
        const lines = part.split("\n");
        let event = "message";
        let data = "";
        for (const l of lines) {
          if (l.startsWith("event:")) event = l.slice(6).trim();
          else if (l.startsWith("data:")) data += l.slice(5).trim();
        }
        if (!data) continue;
        try {
          const j = JSON.parse(data);
          if (event === "session" && j.session_id) onSession?.(j.session_id);
          else if (event === "error") onError?.(new Error(j.error || "AI error"));
          else if (event === "done") { /* handled below */ }
          else if (j.delta) onDelta?.(j.delta);
        } catch {
          /* ignore parse issues */
        }
      }
    }
    onDone?.();
  } catch (e) {
    onError?.(e);
  }
}
