import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Receipt,
  CreditCard,
  Wrench,
  LineChart,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Notebook,
  FileSpreadsheet,
  Smartphone,
  Camera,
  Check,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="container inner">
          <div className="row">
            <div className="brand-mark" style={{ width: 34, height: 34 }}>
              A
            </div>
            <div>
              <div className="brand-name" style={{ fontSize: 18, color: "var(--royal-ink)" }}>
                ABYNS KOS
              </div>
              <div className="brand-sub" style={{ color: "var(--muted)" }}>
                AI Property OS
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 22 }}>
            <a className="muted" href="#solution">
              Product
            </a>
            <a className="muted" href="#ai">
              ABYNS AI
            </a>
            <a className="muted" href="#health">
              Health Score
            </a>
            <Link to="/dashboard" className="btn btn-primary btn-sm" data-testid="nav-explore-demo">
              Explore Demo <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner reveal">
          <div>
            <div className="eyebrow">
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--gold)",
                  borderRadius: "50%",
                }}
              />
              AI Property Operating System
            </div>
            <h1 className="h1">
              From managing rooms to <em>understanding</em>{" "}
              <span className="accent">your property.</span>
            </h1>
            <p className="lede">
              ABYNS KOS membantu pemilik kos di Indonesia memahami pembayaran, occupancy,
              maintenance, dan performa bisnis dalam satu ruang kerja yang cerdas.
            </p>
            <div className="cta-row">
              <Link to="/dashboard" className="btn btn-primary" data-testid="hero-explore-demo">
                Explore Demo <ArrowRight size={16} />
              </Link>
              <a href="#solution" className="btn btn-ghost">
                See How It Works
              </a>
            </div>
            <div className="row" style={{ marginTop: 34, gap: 26, color: "var(--muted)" }}>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: "var(--ink)" }}>
                  87
                </div>
                <div className="small">Property Health</div>
              </div>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: "var(--ink)" }}>
                  91%
                </div>
                <div className="small">Occupancy</div>
              </div>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: "var(--ink)" }}>
                  Rp38,5Jt
                </div>
                <div className="small">Revenue MTD</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 8 }}>
                <span
                  style={{ width: 10, height: 10, borderRadius: "50%", background: "#f2c8d0" }}
                />
                <span
                  style={{ width: 10, height: 10, borderRadius: "50%", background: "#f0e0b0" }}
                />
                <span
                  style={{ width: 10, height: 10, borderRadius: "50%", background: "#cfe6d8" }}
                />
              </div>
              <div className="small muted">abyns.id/dashboard</div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="kpi royal" style={{ padding: 14 }}>
                <div className="label">Occupancy</div>
                <div className="value">91%</div>
                <div className="delta muted">19 of 24 rooms</div>
              </div>
              <div className="kpi gold" style={{ padding: 14 }}>
                <div className="label">Revenue MTD</div>
                <div className="value">Rp38,5Jt</div>
                <div className="delta" style={{ color: "var(--success)" }}>
                  ▲ 12.4%
                </div>
              </div>
            </div>
            <div
              className="ai-card"
              style={{ marginTop: 12, padding: 16, borderRadius: 18 }}
            >
              <div className="ai-eyebrow">
                <span className="pulse" /> ABYNS AI INSIGHT
              </div>
              <div className="ai-insight" style={{ fontSize: 16, margin: "8px 0" }}>
                Revenue naik 12%, tapi 3 kamar telah kosong &gt;20 hari.
              </div>
              <div className="ai-reco small">
                Prioritaskan A-07 dan review harga.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container">
          <div style={{ maxWidth: 780 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              The Problem
            </div>
            <h2>Running a kos should not feel like managing five different businesses.</h2>
            <p className="lede">
              Data ada di mana-mana. Keputusan tetap manual. ABYNS KOS menggabungkan semuanya ke
              dalam satu operating system yang cerdas.
            </p>
          </div>
          <div className="problem-grid">
            {[
              { Icon: MessageSquare, label: "WhatsApp" },
              { Icon: FileSpreadsheet, label: "Spreadsheet" },
              { Icon: Notebook, label: "Notebook" },
              { Icon: Smartphone, label: "Mobile Banking" },
              { Icon: Camera, label: "Screenshots" },
            ].map(({ Icon, label }) => (
              <div key={label} className="problem-tile">
                <div className="ico">
                  <Icon size={26} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="trans-flow" style={{ marginTop: 26 }}>
            <div className="tag">Manual</div>
            <span className="arrow">→</span>
            <div className="tag">Fragmented</div>
            <span className="arrow">→</span>
            <div className="tag">Reactive</div>
            <span
              className="arrow"
              style={{ marginInline: 10, color: "var(--gold-deep)", fontSize: 22 }}
            >
              ⟶
            </span>
            <div className="tag after">Connected</div>
            <span className="arrow" style={{ color: "#fff" }}>
              →
            </span>
            <div className="tag after">Intelligent</div>
            <span className="arrow" style={{ color: "#fff" }}>
              →
            </span>
            <div className="tag after">Proactive</div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="section" id="solution">
        <div className="container">
          <div style={{ maxWidth: 780 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              The Solution
            </div>
            <h2>One operating system for your property.</h2>
            <p className="lede">
              Terintegrasi dari operasional harian sampai analisa strategis. Semua modul dirancang
              untuk pemilik kos Indonesia — bukan generic admin panel.
            </p>
          </div>
          <div className="module-grid">
            {[
              { Icon: Building2, t: "Property", d: "Kelola kos, gedung & kamar dalam satu view." },
              { Icon: Users, t: "Tenant", d: "Profil, kontrak, dan payment health score." },
              { Icon: Receipt, t: "Billing", d: "Invoice otomatis, reminder, dan verifikasi." },
              { Icon: CreditCard, t: "Payment", d: "Pantau paid, pending, dan overdue realtime." },
              { Icon: Wrench, t: "Maintenance", d: "Workflow perbaikan dari laporan sampai selesai." },
              { Icon: LineChart, t: "Finance", d: "Revenue, expense, dan net income transparan." },
              { Icon: Sparkles, t: "AI", d: "Insight & rekomendasi setiap hari untuk owner." },
              { Icon: Notebook, t: "Reports", d: "Laporan periodik siap dibagikan." },
            ].map((m) => (
              <div key={m.t} className="module">
                <div className="ico">
                  <m.Icon size={22} />
                </div>
                <h4>{m.t}</h4>
                <p>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI DIFFERENTIATOR */}
      <section className="section dark-section" id="ai">
        <div className="container">
          <div style={{ maxWidth: 780 }}>
            <div
              className="eyebrow"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--gold-hi)", borderColor: "rgba(212,175,55,0.35)" }}
            >
              <Sparkles size={12} /> ABYNS AI
            </div>
            <h2>
              Don&apos;t just see your data. <em style={{ fontStyle: "italic" }}>Understand it.</em>
            </h2>
            <p className="lede">
              ABYNS AI menganalisa property Anda dan memberikan rekomendasi konkret—bukan hanya
              chart yang harus Anda tafsirkan sendiri.
            </p>
          </div>

          <div className="ai-showcase">
            <div className="q-bubble">Kenapa revenue saya turun bulan ini?</div>
            <div className="a-bubble">
              <div className="ai-eyebrow" style={{ marginBottom: 8 }}>
                <span className="pulse" /> ABYNS AI
              </div>
              <div className="ai-insight">
                Revenue turun 11% dibanding bulan lalu. Faktor terbesar: <b>3 kamar kosong</b>{" "}
                rata-rata 24 hari.
              </div>
              <div className="ai-reco">
                Rekomendasi: prioritaskan <b>A-07</b>, review harga dan listing-nya. Estimasi
                dampak: +Rp5,1Jt bila terisi minggu ini.
              </div>
              <div className="ai-actions">
                <Link to="/ai" className="btn btn-gold btn-sm">
                  Ask ABYNS AI <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HEALTH SCORE */}
      <section className="section" id="health">
        <div className="container grid-2" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              Property Health Score
            </div>
            <h2>A simple score that tells you where your property needs attention.</h2>
            <p className="lede">
              Occupancy, pembayaran, maintenance, revenue growth, dan tenant experience—dirangkum
              dalam satu angka.
            </p>
          </div>
          <div className="card" style={{ padding: 30 }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <div className="card-title" style={{ margin: 0 }}>
                Property Health
              </div>
              <span className="badge badge-success badge-dot">Very Healthy</span>
            </div>
            <div
              className="row"
              style={{ gap: 30, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 72,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  87
                  <span
                    style={{ fontSize: 28, color: "var(--muted)", marginLeft: 6 }}
                  >
                    / 100
                  </span>
                </div>
              </div>
              <div className="grow" style={{ minWidth: 220 }}>
                {[
                  ["Occupancy", 92],
                  ["Payment Collection", 88],
                  ["Maintenance", 76],
                  ["Revenue Growth", 83],
                  ["Tenant Experience", 91],
                ].map(([n, v]) => (
                  <div key={n} className="health-row">
                    <div className="small" style={{ color: "var(--ink-2)" }}>
                      {n}
                    </div>
                    <div className="health-bar">
                      <span style={{ width: `${v}%` }} />
                    </div>
                    <div className="small mono" style={{ textAlign: "right", fontWeight: 700 }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OWNER + TENANT */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container">
          <div style={{ maxWidth: 780 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              Ecosystem
            </div>
            <h2>Built for owners. Loved by tenants.</h2>
            <p className="lede">
              ABYNS KOS bukan sekadar admin panel—ini ekosistem yang menghubungkan pemilik dan
              penghuni dalam satu experience.
            </p>
          </div>
          <div className="two-view">
            <div className="panel">
              <h3>For Owner</h3>
              <ul>
                {[
                  "Tahu apa yang sedang terjadi di property Anda.",
                  "Tahu apa yang butuh perhatian hari ini.",
                  "Buat keputusan yang lebih baik dengan data.",
                ].map((x) => (
                  <li key={x}>
                    <Check size={18} className="check" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="panel"
              style={{
                background: "linear-gradient(180deg, #fbf5e6, #fdf1c6)",
                borderColor: "#f0dfa6",
              }}
            >
              <h3>For Tenant</h3>
              <ul>
                {[
                  "Lihat tagihan yang transparan.",
                  "Track riwayat pembayaran.",
                  "Laporkan maintenance kapan saja.",
                  "Terima pengumuman langsung dari owner.",
                ].map((x) => (
                  <li key={x}>
                    <Check
                      size={18}
                      className="check"
                      style={{ flexShrink: 0, marginTop: 2, color: "var(--gold-deep)" }}
                    />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section">
        <div className="container final-cta card" style={{ padding: "60px 30px" }}>
          <h2>
            Your property has data. <em>ABYNS KOS</em> turns it into decisions.
          </h2>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link to="/dashboard" className="btn btn-primary" data-testid="final-cta-dashboard">
              Explore the Owner Dashboard <ArrowRight size={16} />
            </Link>
            <Link to="/ai" className="btn btn-gold" data-testid="final-cta-ai">
              See ABYNS AI <Sparkles size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        © 2026 ABYNS KOS — AI Property Operating System · Prototype.
        <span style={{ marginLeft: 8 }}>Made in Bandung, Indonesia.</span>
      </footer>
    </div>
  );
}
