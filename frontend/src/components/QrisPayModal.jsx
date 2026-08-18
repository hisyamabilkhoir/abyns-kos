import { useEffect, useRef, useState } from "react";
import { chargeQris, getQrisStatus } from "../services/tenantPortalService";
import { api, currency } from "../services/api";
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";

/**
 * QrisPayModal — creates a Midtrans Snap transaction and launches the Snap overlay
 * (which includes QRIS, GoPay, ShopeePay, DANA, OVO, VA, and Cards).
 * After Snap resolves, we poll our backend to confirm settlement.
 *
 * Props: invoice { id, amount, period }, onClose(paid?: boolean)
 */

let snapScriptPromise = null;
async function loadSnap() {
  if (typeof window === "undefined") return null;
  if (window.snap) return window.snap;
  if (snapScriptPromise) return snapScriptPromise;

  snapScriptPromise = (async () => {
    const cfg = await api.get("/midtrans/config").then((r) => r.data);
    const src =
      cfg.env === "production"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-client-key", cfg.client_key || "");
      s.onload = () => resolve(window.snap);
      s.onerror = () => reject(new Error("Failed to load Snap.js"));
      document.head.appendChild(s);
    });
  })();
  return snapScriptPromise;
}

export default function QrisPayModal({ invoice, onClose }) {
  const [intent, setIntent] = useState(null);
  const [status, setStatus] = useState("preparing"); // preparing | opening | pending | settlement | failed
  const [err, setErr] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [snap, data] = await Promise.all([
          loadSnap(),
          chargeQris(invoice.id),
        ]);
        if (cancelled) return;
        if (data.already_paid) {
          setStatus("settlement");
          return;
        }
        setIntent(data);
        if (!snap) {
          setErr("Snap.js gagal dimuat. Cek koneksi.");
          setStatus("failed");
          return;
        }
        setStatus("opening");
        snap.pay(data.snap_token, {
          onSuccess: () => refreshFromServer(),
          onPending: () => refreshFromServer(),
          onError: (e) => {
            setErr(e?.status_message || "Pembayaran gagal.");
            setStatus("failed");
          },
          onClose: () => {
            // user closed without paying — go to pending waiting state
            setStatus("pending");
          },
        });
      } catch (e) {
        setErr(e?.response?.data?.detail || e?.message || "Gagal membuat transaksi.");
        setStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [invoice.id]);

  const refreshFromServer = async () => {
    try {
      const s = await getQrisStatus(invoice.id);
      if (s.status === "settlement") {
        setStatus("settlement");
        if (pollRef.current) clearInterval(pollRef.current);
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("pending");
    }
  };

  // Poll for late-settlement (e.g. user closes Snap after paying)
  useEffect(() => {
    if (status !== "pending") return;
    pollRef.current = setInterval(refreshFromServer, 3500);
    return () => clearInterval(pollRef.current);
  }, [status]);

  const reopenSnap = async () => {
    const snap = await loadSnap();
    if (snap && intent?.snap_token) {
      setStatus("opening");
      snap.pay(intent.snap_token, {
        onSuccess: refreshFromServer,
        onPending: refreshFromServer,
        onError: (e) => {
          setErr(e?.status_message || "Pembayaran gagal.");
          setStatus("failed");
        },
        onClose: () => setStatus("pending"),
      });
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(status === "settlement")}
    >
      <div className="modal qris-modal" data-testid="qris-modal">
        <div className="row between" style={{ marginBottom: 8 }}>
          <div className="row" style={{ gap: 8 }}>
            <div className="qris-badge">QRIS</div>
            <div className="small muted" style={{ fontWeight: 600 }}>
              Powered by Midtrans Snap
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => onClose(status === "settlement")}
            aria-label="Close"
            data-testid="qris-close"
          >
            <X size={16} />
          </button>
        </div>

        {(status === "preparing" || status === "opening") && (
          <div className="qris-loading">
            <div className="qris-spinner" />
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500 }}>
              {status === "preparing" ? "Menyiapkan transaksi..." : "Membuka Snap Payment..."}
            </div>
            <div className="muted small" style={{ marginTop: 4 }}>
              QRIS, GoPay, ShopeePay, DANA, OVO, VA, dan Kartu Kredit
            </div>
          </div>
        )}

        {status === "pending" && intent && (
          <>
            <div className="qris-amount">
              <div className="small muted">Menunggu pembayaran</div>
              <div
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 30,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  marginTop: 4,
                }}
              >
                {currency(intent.amount || invoice.amount)}
              </div>
              <div className="small muted" style={{ marginTop: 4 }}>
                Order ID <span className="mono">{intent.order_id}</span>
              </div>
            </div>

            <div className="qris-pending-box">
              <Loader2 className="qris-rotate" size={22} />
              <div>
                <div style={{ fontWeight: 600 }}>Belum menerima konfirmasi</div>
                <div className="small muted">
                  Sistem akan otomatis update begitu Midtrans mengonfirmasi pembayaran Anda.
                </div>
              </div>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" onClick={reopenSnap} style={{ flex: 1 }} data-testid="qris-reopen">
                Buka Snap lagi
              </button>
              <button className="btn btn-ghost" onClick={() => onClose(false)}>
                Nanti
              </button>
            </div>

            <div className="qris-help">
              <ShieldCheck size={16} style={{ color: "var(--gold-deep)", flexShrink: 0 }} />
              <div>
                <b>Semua transaksi aman.</b> Diproses langsung oleh Midtrans dan diverifikasi via
                signature SHA512.
              </div>
            </div>
          </>
        )}

        {status === "settlement" && (
          <div className="qris-success">
            <div className="qris-check">
              <CheckCircle2 size={44} />
            </div>
            <div
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 26,
                fontWeight: 500,
                marginTop: 10,
              }}
            >
              Pembayaran diterima 🎉
            </div>
            <div className="muted small" style={{ marginTop: 4 }}>
              Terima kasih! Tagihan Anda telah lunas.
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 18 }}
              onClick={() => onClose(true)}
              data-testid="qris-done"
            >
              Selesai
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="qris-error">
            <AlertTriangle size={26} style={{ color: "var(--danger)" }} />
            <div style={{ fontWeight: 600, marginTop: 6 }}>
              Tidak dapat memproses pembayaran
            </div>
            <div
              className="small muted"
              style={{ marginTop: 4, maxWidth: 340, marginInline: "auto" }}
            >
              {err}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 14, justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => onClose(false)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
