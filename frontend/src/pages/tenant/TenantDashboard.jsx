import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTenantDashboard } from "../../services/tenantPortalService";
import { renewContract } from "../../services/contractService";
import { Card, Badge, Skeleton, statusVariant, statusLabel } from "../../components/UI";
import { currency } from "../../services/api";
import QrisPayModal from "../../components/QrisPayModal";
import TenantAnnouncements from "../../components/TenantAnnouncements";
import {
  Home,
  Calendar,
  CreditCard,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Receipt,
  RefreshCw,
  X,
} from "lucide-react";

export default function TenantDashboard() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [showQris, setShowQris] = useState(false);
  const [paidToast, setPaidToast] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewMonths, setRenewMonths] = useState(12);
  const [renewing, setRenewing] = useState(false);
  const [renewToast, setRenewToast] = useState("");

  const openRenew = () => setRenewOpen(true);
  const submitRenew = async () => {
    if (!data?.contract?.id || renewing) return;
    setRenewing(true);
    await renewContract(data.contract.id, renewMonths);
    setRenewToast(`Kontrak diperpanjang ${renewMonths} bulan 🎉`);
    setTimeout(() => setRenewToast(""), 3500);
    setRenewOpen(false);
    setRenewMonths(12);
    await load();
    setRenewing(false);
  };

  const load = () => getTenantDashboard(id).then(setData).catch(console.error);
  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <Skeleton h={280} />;

  const inv = data.current_invoice;
  const canPay = inv && inv.status !== "paid";

  const openQris = () => setShowQris(true);
  const closeQris = (paid) => {
    setShowQris(false);
    if (paid) {
      setPaidToast(true);
      load();
      setTimeout(() => setPaidToast(false), 3500);
    }
  };

  return (
    <div className="fade-in">
      {paidToast && (
        <div className="paid-toast" data-testid="paid-toast">
          <CheckCircle2 size={18} /> Pembayaran berhasil. Terima kasih!
        </div>
      )}
      {renewToast && (
        <div className="paid-toast" data-testid="renew-toast-tenant">
          <CheckCircle2 size={18} /> {renewToast}
        </div>
      )}

      {renewOpen && data.contract && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setRenewOpen(false)}
        >
          <div className="modal" data-testid="tenant-renew-modal">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 10 }}>
                <div className="mini-ico" style={{ background: "#fbf1d6", color: "var(--gold-deep)" }}>
                  <RefreshCw />
                </div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                  Perpanjang Kontrak
                </div>
              </div>
              <button className="icon-btn" onClick={() => setRenewOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="small muted">Kontrak berakhir</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 500 }}>
              {data.contract.end_date}
            </div>

            <label className="small muted" style={{ marginTop: 14, display: "block" }}>
              Perpanjang berapa bulan?
            </label>
            <div className="row" style={{ gap: 6, marginTop: 6 }}>
              {[3, 6, 12, 24].map((m) => (
                <button
                  key={m}
                  className="btn btn-sm"
                  onClick={() => setRenewMonths(m)}
                  data-testid={`tenant-renew-${m}`}
                  style={{
                    background: renewMonths === m ? "var(--royal)" : "#fff",
                    color: renewMonths === m ? "#fff" : "var(--ink-2)",
                    border: `1px solid ${renewMonths === m ? "var(--royal)" : "var(--line)"}`,
                  }}
                >
                  {m} bln
                </button>
              ))}
            </div>

            <div className="qris-help" style={{ marginTop: 14 }}>
              <RefreshCw size={16} style={{ color: "var(--gold-deep)", flexShrink: 0 }} />
              <div>
                Kami akan otomatis memperpanjang kontrak Anda dan memberitahu pemilik kos. Tarif{" "}
                {currency(data.contract.monthly_rent)}/bulan tetap sama.
              </div>
            </div>

            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setRenewOpen(false)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={submitRenew}
                disabled={renewing}
                data-testid="tenant-renew-confirm"
                style={{ flex: 1 }}
              >
                {renewing ? "Memproses..." : `Perpanjang ${renewMonths} Bulan`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQris && inv && <QrisPayModal invoice={inv} onClose={closeQris} />}

      <TenantAnnouncements tenantId={id} />

      <div className="bill-card reveal">
        <div className="row between">
          <div>
            <div className="ai-eyebrow" style={{ color: "var(--gold-hi)" }}>
              <span className="pulse" /> Tagihan Bulan Ini
            </div>
            <div className="bill-amount">{currency(inv?.amount || 0)}</div>
            <div className="row" style={{ gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              {inv && (
                <Badge variant={statusVariant(inv.status)} dot>
                  {statusLabel(inv.status)}
                </Badge>
              )}
              {inv?.due_date && (
                <span className="small" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Calendar size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                  Jatuh tempo {inv.due_date}
                  {data.days_until_due != null &&
                    ` (${
                      data.days_until_due === 0
                        ? "hari ini"
                        : data.days_until_due > 0
                          ? `${data.days_until_due} hari lagi`
                          : `${Math.abs(data.days_until_due)} hari lewat`
                    })`}
                </span>
              )}
            </div>
          </div>
          {canPay && (
            <button
              className="btn btn-gold"
              onClick={openQris}
              data-testid="pay-now-btn"
            >
              <CreditCard size={16} /> Bayar via QRIS
            </button>
          )}
        </div>
        {!inv && (
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 12 }}>
            Belum ada tagihan aktif bulan ini.
          </p>
        )}
        {inv?.status === "paid" && (
          <div className="row" style={{ gap: 8, marginTop: 12, color: "var(--gold-hi)" }}>
            <CheckCircle2 size={18} /> <span>Lunas — terima kasih! 🎉</span>
          </div>
        )}
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <Card>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <div className="mini-ico">
              <Home size={16} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>
              Kamar
            </div>
          </div>
          <div
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            {data.tenant.room_number}
          </div>
          {data.contract && (
            <div className="small muted">
              {currency(data.contract.monthly_rent)}/bulan
            </div>
          )}
        </Card>

        <Card>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <div className="mini-ico">
              <CreditCard size={16} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>
              Total Dibayar
            </div>
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500 }}>
            {currency(data.total_paid)}
          </div>
          <div className="small muted">
            {data.paid_invoices} dari {data.total_invoices} invoice
          </div>
        </Card>

        <Card>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <div
              className="mini-ico"
              style={{ background: "#fbf1d6", color: "var(--gold-deep)" }}
            >
              <Wrench size={16} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>
              Maintenance
            </div>
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500 }}>
            {data.open_maintenance}
          </div>
          <div className="small muted">Laporan aktif</div>
        </Card>
      </div>

      {data.contract && (
        <Card title="Kontrak Saya" style={{ marginTop: 18 }}>
          <div className="grid-2">
            <div>
              <div className="small muted">Mulai kontrak</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>
                {data.contract.start_date}
              </div>
            </div>
            <div>
              <div className="small muted">Berakhir</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>
                {data.contract.end_date}
              </div>
            </div>
            <div>
              <div className="small muted">Deposit</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>
                {currency(data.contract.deposit)}
              </div>
            </div>
            <div>
              <div className="small muted">Status</div>
              <div style={{ marginTop: 4 }}>
                <Badge variant="success" dot>Active</Badge>
              </div>
            </div>
          </div>
          {data.contract_days_remaining != null && (
            <div
              className={`moveout-card ${
                data.contract_days_remaining < 0
                  ? "danger"
                  : data.contract_days_remaining <= 30
                    ? "warn"
                    : "info"
              }`}
            >
              <div style={{ flex: 1 }}>
                <div className="small" style={{ fontWeight: 700, letterSpacing: "0.14em" }}>
                  MOVE-OUT COUNTDOWN
                </div>
                <div
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 30,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    marginTop: 2,
                  }}
                >
                  {data.contract_days_remaining < 0
                    ? `Kontrak lewat ${Math.abs(data.contract_days_remaining)} hari`
                    : data.contract_days_remaining === 0
                      ? "Kontrak berakhir hari ini"
                      : `${data.contract_days_remaining} hari lagi`}
                </div>
                <div className="small" style={{ opacity: 0.85, marginTop: 2 }}>
                  Berakhir {data.contract.end_date}
                </div>
              </div>
              {data.contract_days_remaining <= 60 && (
                <button
                  className="btn btn-gold"
                  onClick={openRenew}
                  data-testid="tenant-renew-btn"
                >
                  <RefreshCw size={14} /> Perpanjang Kontrak
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      <Card title="Aksi Cepat" style={{ marginTop: 18 }}>
        <div className="col" style={{ gap: 8 }}>
          <button className="qa-btn" onClick={() => nav(`/tenant/${id}/bills`)} data-testid="qa-bills">
            <div className="mini-ico"><Receipt /></div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 600 }}>Lihat Semua Tagihan</div>
              <div className="small muted">Riwayat & invoice mendatang</div>
            </div>
            <ArrowRight size={16} />
          </button>
          <button className="qa-btn" onClick={() => nav(`/tenant/${id}/maintenance`)} data-testid="qa-maintenance">
            <div className="mini-ico" style={{ background: "#fbf1d6", color: "var(--gold-deep)" }}>
              <Wrench />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 600 }}>Lapor Maintenance</div>
              <div className="small muted">AC, keran, listrik, wifi, dll.</div>
            </div>
            <ArrowRight size={16} />
          </button>
          <div
            className="qa-btn"
            style={{
              background: "linear-gradient(180deg, #2b0f3f, #1c0a2b)",
              color: "#fff",
              borderColor: "transparent",
              cursor: "default",
            }}
          >
            <div className="mini-ico" style={{ background: "rgba(212,175,55,0.2)", color: "var(--gold-hi)" }}>
              <Sparkles />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 600 }}>Payment Health: {data.tenant.payment_health}</div>
              <div className="small" style={{ color: "rgba(255,255,255,0.7)" }}>
                Bayar tepat waktu untuk skor lebih tinggi.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
