"use client";

import Link from "next/link";
import { getClientCopy } from "../../lib/i18n/client";
import { LanguageToggle } from "../LanguageToggle";

/* ─── Design tokens ─── */
const T = {
  bg0: "#08050a", bg1: "#110a08", bg2: "#1a0f0a",
  line: "rgba(232,200,118,0.12)", lineStrong: "rgba(232,200,118,0.28)",
  brass300: "#e8c876", brass400: "#c89a4a",
  ink100: "#fff8e8", ink200: "#f0e0c0", ink300: "#c8b890",
  ink400: "#8b7d5e", ink500: "#5a4f3a",
};

export function AuthShell({
  title, sub, children, mode = "login",
}: {
  title: string; sub: string; children: React.ReactNode;
  mode?: "login" | "signup";
}) {
  const copy = getClientCopy();

  return (
    <div className="auth-shell" style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
      background: T.bg0, color: T.ink200,
      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
    }}>
      <style>{`
        @media (max-width: 860px) {
          .auth-shell {
            display: block !important;
            min-height: 100svh !important;
            overflow-x: hidden;
          }
          .auth-visual {
            min-height: auto !important;
            padding: 22px 20px 18px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(232,200,118,0.18) !important;
          }
          .auth-visual-center {
            display: none !important;
          }
          .auth-visual-footer {
            display: none !important;
          }
          .auth-main {
            min-height: auto !important;
            padding: 22px 20px 30px !important;
            overflow: visible !important;
          }
          .auth-topbar {
            margin-bottom: 30px !important;
            gap: 14px !important;
            align-items: flex-start !important;
          }
          .auth-topbar > span {
            max-width: 150px;
            text-align: right;
            line-height: 1.35;
          }
          .auth-form-wrap {
            max-width: none !important;
            margin: 0 !important;
          }
          .auth-form-wrap h1 {
            font-size: 42px !important;
          }
          .auth-form-wrap p {
            margin-bottom: 24px !important;
            font-size: 14px !important;
          }
          .auth-copyright {
            padding-top: 28px !important;
          }
        }
        @media (max-width: 420px) {
          .auth-topbar {
            flex-direction: column !important;
          }
          .auth-topbar > span {
            max-width: none;
            text-align: left;
          }
          .auth-form-wrap h1 {
            font-size: 36px !important;
          }
        }
      `}</style>
      {/* ══ LEFT: Visual ══ */}
      <aside className="auth-visual" style={{
        background: `
          radial-gradient(60% 80% at 30% 20%, rgba(232,200,118,0.18), transparent 70%),
          radial-gradient(40% 60% at 80% 80%, rgba(200,30,53,0.16), transparent 70%),
          linear-gradient(160deg, #1a0f08 0%, #08050a 100%)`,
        borderRight: `1px solid ${T.lineStrong}`,
        padding: "56px",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        {/* dot pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: [
            "radial-gradient(circle at 20% 30%, rgba(232,200,118,0.4) 1px, transparent 1.5px)",
            "radial-gradient(circle at 70% 60%, rgba(232,200,118,0.3) 1px, transparent 1.5px)",
            "radial-gradient(circle at 40% 80%, rgba(200,30,53,0.3) 1px, transparent 1.5px)",
          ].join(","),
          backgroundSize: "80px 80px, 60px 60px, 100px 100px",
          opacity: 0.5,
        }} />

        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative", zIndex: 2 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(160deg, #e8c876, #5a3414)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Playfair Display', serif", fontWeight: 900,
            color: "#1a0f06", fontSize: 16,
          }}>J</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: T.ink100 }}>{copy.meta.brand}</span>
        </Link>

        {/* Center content */}
        <div className="auth-visual-center" style={{ position: "relative", zIndex: 2 }}>
          {/* Mini slot machine */}
          <div style={{
            marginTop: 80, display: "flex", gap: 8,
            background: "linear-gradient(180deg, #08050a, #1a0f06)",
            padding: 14, borderRadius: 12, border: `1px solid ${T.lineStrong}`,
            boxShadow: "inset 0 4px 16px rgba(0,0,0,0.6)",
            width: "fit-content",
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 56, height: 72, background: "linear-gradient(180deg, #1a0f06, #08050a)",
                borderRadius: 6, overflow: "hidden", position: "relative",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
              }}>
                <div style={{
                  display: "flex", flexDirection: "column",
                  animation: `mini-roll ${2.4 + i * 0.6}s cubic-bezier(0.2,0.7,0.3,1) infinite`,
                }}>
                  {["7", "♥", "BAR", "★", "7", "♥", "BAR", "★"].map((sym, j) => (
                    <div key={j} style={{
                      height: 72, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Playfair Display', serif", fontWeight: 900,
                      fontSize: sym === "BAR" ? 14 : 32,
                      color: sym === "7" ? T.brass300 : sym === "♥" ? "#e8533a" : sym === "★" ? "#f7d83a" : T.ink300,
                    }}>{sym}</div>
                  ))}
                </div>
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "50%",
                  height: 28, transform: "translateY(-50%)",
                  borderTop: `1px solid rgba(232,200,118,0.2)`,
                  borderBottom: `1px solid rgba(232,200,118,0.2)`,
                  pointerEvents: "none",
                }} />
              </div>
            ))}
          </div>

          <p style={{
            marginTop: 40, fontFamily: "'Playfair Display', serif",
            fontWeight: 700, fontSize: "clamp(22px, 2.8vw, 36px)",
            lineHeight: 1.15, color: T.ink100, letterSpacing: "-0.01em",
            maxWidth: 480,
          }}>
            {copy.auth.visual.quoteLine1}<br/>
            <span style={{ color: T.brass300, fontStyle: "italic" }}>{copy.auth.visual.quoteLine2}</span><br/>
            {copy.auth.visual.quoteLine3}
          </p>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 14, color: T.ink300, fontSize: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(160deg, #c89a4a, #5a3414)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#1a0f06", fontSize: 18,
              boxShadow: "inset 0 1px 0 rgba(255,244,212,0.4)",
            }}>M</div>
            <div>
              <div style={{ color: T.ink100, fontWeight: 600 }}>{copy.auth.visual.customerName}</div>
              <div style={{ color: T.ink400, fontSize: 12 }}>{copy.auth.visual.customerVenue}</div>
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="auth-visual-footer" style={{
          display: "flex", gap: 28, color: T.ink500, fontSize: 12,
          paddingTop: 24, borderTop: `1px solid ${T.line}`,
          position: "relative", zIndex: 2,
        }}>
          {copy.auth.visual.stats.map((stat) => <span key={stat}>{stat}</span>)}
        </div>

        <style>{`
          @keyframes mini-roll {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}</style>
      </aside>

      {/* ══ RIGHT: Form ══ */}
      <main className="auth-main" style={{ padding: "56px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div className="auth-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 72 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: T.ink400, fontSize: 14 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {copy.common.home}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LanguageToggle />
            <span style={{ color: T.ink500, fontSize: 13 }}>
              {mode === "login"
                ? <span>{copy.auth.topbar.noAccount} <Link href="/signup" style={{ color: T.brass300, textDecoration: "none" }}>{copy.common.connectVenue}</Link></span>
                : <span>{copy.auth.topbar.hasAccount} <Link href="/login" style={{ color: T.brass300, textDecoration: "none" }}>{copy.common.login}</Link></span>
              }
            </span>
          </div>
        </div>

        <div className="auth-form-wrap" style={{ maxWidth: 400, width: "100%", margin: "auto 0" }}>
          <h1 style={{ margin: "0 0 10px", fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(32px, 3.5vw, 44px)", lineHeight: 1.05, color: T.ink100 }}>
            {title}
          </h1>
          <p style={{ margin: "0 0 36px", color: T.ink300, fontSize: 15, lineHeight: 1.6 }}>{sub}</p>

          {children}
        </div>

        <div className="auth-copyright" style={{ marginTop: "auto", paddingTop: 40, color: T.ink500, fontSize: 13, textAlign: "center" }}>
          {copy.auth.footer}
        </div>
      </main>

    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#f0e0c0", letterSpacing: "0.01em" }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "#110a08", border: "1px solid rgba(232,200,118,0.12)",
  borderRadius: 12, padding: "14px 16px",
  color: "#fff8e8", fontSize: 15, outline: "none",
};

export const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "16px", borderRadius: 12,
  background: "linear-gradient(160deg, #f0d690 0%, #c89a4a 50%, #8b6a30 100%)",
  color: "#1a0f06", border: "none", fontSize: 15, fontWeight: 700,
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255,244,212,0.6), inset 0 -1px 0 rgba(74,52,20,0.5), 0 8px 24px -8px rgba(232,200,118,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
};

export const errorStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, marginBottom: 4,
  background: "rgba(255,126,90,0.1)", border: "1px solid rgba(255,126,90,0.3)",
  color: "#ff9d80", fontSize: 13, fontWeight: 500,
};
