import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listTenants } from "../../services/tenantService";
import { tenantLogin, saveSession, getSession } from "../../services/tenantPortalService";
import { Avatar } from "../../components/UI";
import { Sparkles, LogIn, ArrowRight, AlertCircle } from "lucide-react";

export default function TenantLogin() {
  const nav = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s?.tenant?.id) {
      nav(`/tenant/${s.tenant.id}/dashboard`, { replace: true });
      return;
    }
    listTenants().then(setTenants).catch(() => {});
  }, [nav]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const data = await tenantLogin(email.trim());
      saveSession(data);
      nav(`/tenant/${data.tenant.id}/dashboard`);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Login gagal.");
    }
    setBusy(false);
  };

  const quickPick = async (t) => {
    setBusy(true);
    try {
      const data = await tenantLogin(t.email);
      saveSession(data);
      nav(`/tenant/${data.tenant.id}/dashboard`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tenant-login">
      <div className="tl-panel">
        <Link to="/" className="brand" style={{ padding: 0, marginBottom: 24 }}>
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name" style={{ color: "var(--royal-ink)", fontSize: 18 }}>
              ABYNS KOS
            </div>
            <div className="brand-sub" style={{ color: "var(--muted)" }}>
              Tenant Portal
            </div>
          </div>
        </Link>

        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 34, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          Selamat datang kembali <em style={{ color: "var(--royal)" }}>👋</em>
        </h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          Masuk untuk melihat tagihan, riwayat pembayaran, dan melaporkan maintenance.
        </p>

        <form onSubmit={submit} className="col" style={{ gap: 10 }}>
          <label className="small muted">Email</label>
          <input
            className="tl-input"
            type="email"
            placeholder="nama@example.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="tenant-login-email"
          />
          {err && (
            <div className="row small" style={{ color: "var(--danger)", gap: 6 }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !email.trim()}
            data-testid="tenant-login-submit"
            style={{ marginTop: 6 }}
          >
            <LogIn size={16} /> {busy ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="tl-divider">
          <span>atau pilih akun demo</span>
        </div>

        <div className="tl-quick">
          {tenants.slice(0, 6).map((t) => (
            <button
              key={t.id}
              className="tl-quick-item"
              onClick={() => quickPick(t)}
              data-testid={`tl-quick-${t.id}`}
            >
              <Avatar name={t.name} size="sm" />
              <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.name}
                </div>
                <div className="small muted">{t.room_number}</div>
              </div>
              <ArrowRight size={14} style={{ color: "var(--muted)" }} />
            </button>
          ))}
        </div>

        <div className="row small muted" style={{ justifyContent: "center", marginTop: 22, gap: 6 }}>
          <Link to="/" style={{ color: "var(--royal)", fontWeight: 600 }}>← Kembali ke landing</Link>
          <span>·</span>
          <Link to="/dashboard" style={{ color: "var(--royal)", fontWeight: 600 }}>Owner Dashboard</Link>
        </div>
      </div>

      <div className="tl-side">
        <div className="tl-side-inner">
          <div className="ai-eyebrow" style={{ color: "var(--gold-hi)" }}>
            <Sparkles size={12} /> Tenant Experience
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 44, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "16px 0" }}>
            Bayar kos, lapor maintenance, dan lihat riwayat — semua di satu tempat.
          </div>
          <div className="muted" style={{ color: "rgba(255,255,255,0.7)", maxWidth: 420 }}>
            Portal penghuni ABYNS KOS memberikan transparansi penuh tentang kontrak, tagihan, dan
            komunikasi dengan pemilik kos Anda.
          </div>
          <div className="tl-features">
            {[
              ["Tagihan Transparan", "Lihat detail invoice bulan ini + riwayat lengkap."],
              ["ABYNS Pay", "Bayar sekali klik — pemilik langsung diberitahu."],
              ["Lapor Maintenance", "Kirim laporan, tracking status realtime."],
            ].map(([t, d]) => (
              <div key={t} className="tl-feat">
                <div className="tl-feat-bullet" />
                <div>
                  <div style={{ fontWeight: 600 }}>{t}</div>
                  <div className="small" style={{ color: "rgba(255,255,255,0.6)" }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
