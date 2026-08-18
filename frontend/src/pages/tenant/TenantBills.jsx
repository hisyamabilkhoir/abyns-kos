import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listMyInvoices, payInvoice } from "../../services/tenantPortalService";
import { Card, Badge, Skeleton, statusVariant, statusLabel } from "../../components/UI";
import { currency } from "../../services/api";
import { CreditCard, CheckCircle2 } from "lucide-react";

export default function TenantBills() {
  const { id } = useParams();
  const [rows, setRows] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [toast, setToast] = useState("");

  const load = () => listMyInvoices(id).then(setRows).catch(console.error);
  useEffect(() => { load(); }, [id]);

  const doPay = async (invId) => {
    setPayingId(invId);
    await payInvoice(invId);
    setToast("Pembayaran berhasil.");
    setTimeout(() => setToast(""), 3000);
    await load();
    setPayingId(null);
  };

  if (!rows) return <Skeleton h={320} />;

  const current = rows.filter((r) => r.status !== "paid");
  const history = rows.filter((r) => r.status === "paid");

  return (
    <div className="fade-in">
      {toast && <div className="paid-toast" data-testid="bill-toast"><CheckCircle2 size={18} /> {toast}</div>}
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 28 }}>Tagihan Saya</h1>
          <div className="sub">{rows.length} invoice total · {current.length} belum lunas</div>
        </div>
      </div>

      {current.length > 0 && (
        <Card title="Menunggu Pembayaran" data-testid="unpaid-list">
          <div className="col" style={{ gap: 10 }}>
            {current.map((i) => (
              <div key={i.id} className="bill-row" data-testid={`bill-row-${i.id}`}>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <Badge variant={statusVariant(i.status)} dot>{statusLabel(i.status)}</Badge>
                    <span className="small muted">Periode {i.period}</span>
                  </div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
                    {currency(i.amount)}
                  </div>
                  <div className="small muted">
                    Jatuh tempo {i.due_date}
                    {i.days_diff != null && (
                      <> · {i.days_diff === 0 ? "hari ini" : i.days_diff > 0 ? `${i.days_diff} hari lagi` : `terlambat ${Math.abs(i.days_diff)} hari`}</>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => doPay(i.id)}
                  disabled={payingId === i.id}
                  data-testid={`pay-btn-${i.id}`}
                >
                  <CreditCard size={14} /> {payingId === i.id ? "..." : "Bayar"}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Riwayat Pembayaran" style={{ marginTop: 16 }} data-testid="history-list">
        {history.length === 0 ? (
          <div className="empty">
            <h4>Belum ada riwayat.</h4>
            <div>Riwayat pembayaran Anda akan muncul di sini.</div>
          </div>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {history.slice(0, 12).map((i) => (
              <div key={i.id} className="row between" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Periode {i.period}</div>
                  <div className="small muted">Dibayar · {i.due_date}</div>
                </div>
                <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                  <div className="mono" style={{ fontWeight: 700 }}>{currency(i.amount)}</div>
                  <Badge variant="success" dot>PAID</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
