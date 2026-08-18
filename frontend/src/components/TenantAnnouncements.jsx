import { useEffect, useState } from "react";
import {
  listTenantAnnouncements,
  markAnnouncementRead,
} from "../services/announcementService";
import { Megaphone, X, AlertTriangle, Info } from "lucide-react";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  urgent: AlertTriangle,
};

export default function TenantAnnouncements({ tenantId }) {
  const [rows, setRows] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    if (!tenantId) return;
    listTenantAnnouncements(tenantId).then(setRows).catch(() => {});
  }, [tenantId]);

  const dismiss = async (id) => {
    setDismissed((s) => new Set([...s, id]));
    try {
      await markAnnouncementRead(tenantId, id);
    } catch {
      /* offline */
    }
  };

  const visible = rows.filter((r) => !r.read && !dismissed.has(r.id));
  if (visible.length === 0) return null;

  return (
    <div className="col" style={{ gap: 10, marginBottom: 14 }} data-testid="tenant-announcements">
      {visible.slice(0, 3).map((a) => {
        const Icon = ICONS[a.priority] || Megaphone;
        return (
          <div
            key={a.id}
            className={`tenant-ann-banner priority-${a.priority}`}
            data-testid={`tenant-ann-${a.id}`}
          >
            <div className="row between" style={{ gap: 10, alignItems: "flex-start" }}>
              <div className="row" style={{ gap: 10, alignItems: "flex-start", flex: 1 }}>
                <div className="ann-icon">
                  <Icon size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="small"
                    style={{
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      opacity: 0.85,
                      marginBottom: 4,
                    }}
                  >
                    {a.priority.toUpperCase()} · dari Pak Adi
                  </div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 500 }}>
                    {a.title}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5, opacity: 0.92 }}>
                    {a.message}
                  </div>
                </div>
              </div>
              <button
                className="ann-dismiss"
                onClick={() => dismiss(a.id)}
                aria-label="Sudah dibaca"
                data-testid={`ann-dismiss-${a.id}`}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
