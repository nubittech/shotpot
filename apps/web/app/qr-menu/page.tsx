import { getServerCopy } from "../../lib/i18n/server";
import { ApplyForm } from "./ApplyForm";

export const dynamic = "force-dynamic";

export default function QrMenuLandingPage() {
  const copy = getServerCopy().qrMenuApply;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "56px 22px 80px", display: "grid", gridTemplateColumns: "1fr", gap: 44 }}>
        {/* Hero */}
        <header>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#ffd84e", textTransform: "uppercase" }}>{copy.eyebrow}</div>
          <h1 style={{ margin: "10px 0 0", fontSize: 36, fontWeight: 800, lineHeight: 1.15, maxWidth: 620 }}>{copy.title}</h1>
          <p style={{ margin: "16px 0 0", fontSize: 16, color: "rgba(244,239,230,0.6)", lineHeight: 1.6, maxWidth: 600 }}>{copy.subtitle}</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 40, alignItems: "start" }} className="qrmenu-grid">
          {/* Benefits */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{copy.benefitsTitle}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {copy.benefits.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "rgba(244,239,230,0.85)", lineHeight: 1.5 }}>
                  <span style={{ color: "#ffd84e", fontWeight: 800 }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Form */}
          <section style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{copy.formTitle}</h2>
            <p style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", margin: "0 0 18px", lineHeight: 1.5 }}>{copy.formDesc}</p>
            <ApplyForm copy={copy} />
          </section>
        </div>
      </div>
      <style>{`@media (max-width: 720px){ .qrmenu-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
