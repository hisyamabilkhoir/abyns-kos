import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { getSession } from "../../services/tenantPortalService";
import { CheckCircle2, Clock, XCircle, ArrowRight, Home } from "lucide-react";

/**
 * Landing page for Midtrans Finish/Unfinish/Error redirects.
 * Midtrans appends ?order_id=...&status_code=...&transaction_status=...
 */
export default function PayResult() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const orderId = params.get("order_id");
  const tStatus = params.get("transaction_status");
  const statusCode = params.get("status_code");
  const [state, setState] = useState("resolving"); // resolving | success | pending | failed
  const [amount, setAmount] = useState(null);
  const session = getSession();

  useEffect(() => {
    const decide = async () => {
      // Priority 1: use query params from Midtrans redirect
      let final = tStatus;
      // Priority 2: if we have a session + tenant, fetch latest invoices to double check
      if (session?.tenant?.id) {
        try {
          const invs = await api
            .get(`/tenant/${session.tenant.id}/invoices`)
            .then((r) => r.data);
          const matched = invs.find(
            (i) => orderId && orderId.toUpperCase().includes(i.id.slice(0, 8).toUpperCase())
          );
          if (matched) {
            setAmount(matched.amount);
            if (matched.status === "paid") final = final || "settlement";
          }
        } catch {
          /* ignore */
        }
      }
      if (["settlement", "capture"].includes(final)) setState("success");
      else if (["expire", "cancel", "deny", "failure"].includes(final) || statusCode === "202")
        setState("failed");
      else setState("pending");
    };
    decide();
  }, []);

  const backHref = session?.tenant?.id
    ? `/tenant/${session.tenant.id}/dashboard`
    : "/tenant/login";

  const config = {
    resolving: {
      icon: <Clock size={44} />,
      color: "var(--royal)",
      title: "Memverifikasi pembayaran...",
      desc: "Sedang mengkonfirmasi status transaksi dari Midtrans.",
    },
    success: {
      icon: <CheckCircle2 size={44} />,
      color: "#1f8f5a",
      title: "Pembayaran berhasil 🎉",
      desc: "Terima kasih! Tagihan Anda telah lunas dan pemilik kos telah diberitahu.",
    },
    pending: {
      icon: <Clock size={44} />,
      color: "#c58a12",
      title: "Pembayaran belum selesai",
      desc: "Anda menutup halaman sebelum konfirmasi. Kalau sudah bayar, tunggu beberapa detik lalu buka portal lagi.",
    },
    failed: {
      icon: <XCircle size={44} />,
      color: "#b91c3c",
      title: "Pembayaran tidak berhasil",
      desc: "Transaksi dibatalkan atau kadaluarsa. Silakan coba lagi dari portal.",
    },
  }[state];

  return (
    <div className="pay-result">
      <div className="pay-result-card fade-in">
        <div className="pay-result-icon" style={{ background: config.color }}>
          {config.icon}
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "18px 0 8px",
          }}
        >
          {config.title}
        </h1>
        <p className="muted" style={{ maxWidth: 420, margin: "0 auto" }}>
          {config.desc}
        </p>

        {(orderId || amount) && (
          <div className="pay-result-meta">
            {orderId && (
              <div>
                <div className="small muted">Order ID</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                  {orderId}
                </div>
              </div>
            )}
            {amount && (
              <div>
                <div className="small muted">Jumlah</div>
                <div style={{ fontWeight: 700 }}>
                  Rp {Number(amount).toLocaleString("id-ID")}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="row"
          style={{ gap: 10, marginTop: 22, justifyContent: "center", flexWrap: "wrap" }}
        >
          <button
            className="btn btn-primary"
            onClick={() => nav(backHref)}
            data-testid="pay-result-back"
          >
            <Home size={16} /> Kembali ke Portal <ArrowRight size={14} />
          </button>
          <Link to="/" className="btn btn-ghost">
            Landing
          </Link>
        </div>
      </div>
    </div>
  );
}
