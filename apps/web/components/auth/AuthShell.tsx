"use client";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#ffd84e", textTransform: "uppercase" }}>Receipt Reward</div>
          <h1 style={{ margin: "10px 0 6px", fontSize: 22, fontWeight: 800 }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(244,239,230,0.5)" }}>{sub}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,239,230,0.55)" }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "10px 14px",
  color: "#f4efe6", fontSize: 13, outline: "none",
};

export const primaryBtn: React.CSSProperties = {
  padding: "12px 20px", borderRadius: 12,
  background: "#ffd84e", border: "none", color: "#111",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
};

export const errorStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10,
  background: "rgba(255,126,90,0.1)", border: "1px solid rgba(255,126,90,0.3)",
  color: "#ff9d80", fontSize: 12, fontWeight: 500,
};
