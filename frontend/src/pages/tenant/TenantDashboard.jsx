import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTenantDashboard, payInvoice } from "../../services/tenantPortalService";
import { Card, Badge, Skeleton, statusVariant, statusLabel } from "../../components/UI";
import { currency } from "../../services/api";
import { Home, Calendar, CreditCard, Wrench, ArrowRight, CheckCircle2, Sparkles, Receipt } from "lucide-react";

export default function TenantDashboard() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paidToast, setPaidToast] = useState(false);

  const load = () => getTenantDashboard(id).then(setData).catch(console.error);
  useEffect(() => { load(); }, [id]);

  if (!data) return <Skeleton h={280} />;

  const inv = data.current_invoice;
  const canPay = inv && inv.status !== "paid";

  const doPay = async () => {
    if (!inv) return;
    setPaying(true);
    await payInvoice(inv.id);
    setPaidToast(true);
    await load();
    setTimeout(() => setPaidToast(false), 3500);
    setPaying(false);
  };

  return (
    <div className="fade-in">
      {paidToast && (
        <div className="paid-toast" data-testid="paid-toast">
          <CheckCircle2 size={18} /> Pembayaran berhasil. Terima kasih!
        </div>
      )}

      {/* Hero bill card */}
      <div className="bill-card reveal">
        <div className="row between">
          <div>
            <div className="ai-eyebrow" style={{ color: "var(--gold-hi)" }}>
              <span className="pulse" /> Tagihan Bulan Ini
            </div>
            <div className="bill-amount">{currency(inv?.amount || 0)}</div>
            <div className="row" style={{ gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              {inv && <Badge variant={statusVariant(inv.status)} dot>{statusLabel(inv.status)}</Badge>}
              {inv?.due_date && (
                <span className="small" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Calendar size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                  Jatuh tempo {inv.due_date}
                  {data.days_until_due != null &&
                    ` (${data.days_until_due === 0 ? "hari ini" : data.days_until_due > 0 ? `${data.days_until_due} hari lagi` : `${Math.abs(data.days_until_due)} hari lewat`})`}
                </span>
              )}
            </div>
          </div>
          {canPay && (
            <button
              className="btn btn-gold"
              onClick={doPay}
              disabled={paying}
              data-testid="pay-now-btn"
            >
              <CreditCard size={16} /> {paying ? "Memproses..." : "Bayar Sekarang"}
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

      {/* Info cards */}
      <div className="grid-3" style={{ marginTop: 18 }}>
        <Card>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <div className="mini-ico"><Home size={16} /></div>
            <div className="card-title" style={{ margin: 0 }}>Kamar</div>
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}>
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
            <div className="mini-ico"><CreditCard size={16} /></div>
            <div className="card-title" style={{ margin: 0 }}>Total Dibayar</div>
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500 }}>
            {currency(data.total_paid)}
          </div>
          <div className="small muted">{data.paid_invoices} dari {data.total_invoices} invoice</div>
        </Card>

        <Card>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <div className="mini-ico" style={{ background: "#fbf1d6", color: "var(--gold-deep)" }}>
              <Wrench size={16} />
            </div>
            <div className="card-title" style={{ margin: 0 }}>Maintenance</div>
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500 }}>
            {data.open_maintenance}
          </div>
          <div className="small muted">Laporan aktif</div>
        </Card>
      </div>

      {/* Contract snapshot */}
      {data.contract && (
        <Card title="Kontrak Saya" style={{ marginTop: 18 }}>
          <div className="grid-2">
            <div>
              <div className="small muted">Mulai kontrak</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>{data.contract.start_date}</div>
            </div>
            <div>
              <div className="small muted">Berakhir</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>{data.contract.end_date}</div>
            </div>
            <div>
              <div className="small muted">Deposit</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>{currency(data.contract.deposit)}</div>
            </div>
            <div>
              <div className="small muted">Status</div>
              <div style={{ marginTop: 4 }}><Badge variant="success" dot>Active</Badge></div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick actions */}
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
          <div className="qa-btn" style={{ background: "linear-gradient(180deg, #2b0f3f, #1c0a2b)", color: "#fff", borderColor: "transparent", cursor: "default" }}>
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
