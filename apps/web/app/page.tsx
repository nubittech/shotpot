import Link from "next/link";
import { createClient } from "../lib/supabase/server-rsc";

export default async function HomePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(120% 80% at 50% 0%, #2c1908 0%, #150803 70%, #08030a 100%)",
      color: "#fff8e0",
      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
    }}>
      {/* Nav */}
      <header style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #ffd84e, #ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#111", fontSize: 16 }}>S</div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.02em" }}>Shotpot</div>
        </div>
        <nav style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href="#how" style={navLink}>Nasıl Çalışır</a>
          <a href="#pricing" style={navLink}>Fiyatlar</a>
          <a href="#contact" style={navLink}>İletişim</a>
          {user ? (
            <Link href="/dashboard" style={primaryBtn}>Panele Git</Link>
          ) : (
            <>
              <Link href="/login" style={navLink}>Giriş</Link>
              <Link href="/signup" style={primaryBtn}>Ücretsiz Başla</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section style={{ padding: "80px 24px 60px", textAlign: "center", maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "rgba(255,216,78,0.1)", border: "1px solid rgba(255,216,78,0.3)", color: "#ffd84e", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 24 }}>
            ★ Bar & restoranlar için sadakat oyunu
        </div>
        <h1 style={{ margin: "0 0 22px", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          Müşterin <span style={{ color: "#ffd84e" }}>fişi tarasın</span>,<br />
          jackpot kazansın.
        </h1>
        <p style={{ margin: "0 auto 36px", fontSize: 18, color: "rgba(255,248,224,0.65)", maxWidth: 580, lineHeight: 1.55 }}>
          Hesap ödendikten sonra QR'ı tarat. Müşterin slot makinesini çevirsin, ödülünü kazansın. Tekrar gelmek için bir sebebi olsun.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ ...primaryBtn, padding: "14px 28px", fontSize: 14 }}>İşletmeni Kur — Ücretsiz</Link>
          <a href="#how" style={{ ...secondaryBtn, padding: "14px 28px", fontSize: 14 }}>Nasıl Çalışır?</a>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "60px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={sectionTitle}>3 Adımda Çalışır</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 40 }}>
          {[
            { n: "1", emoji: "📝", title: "İşletmeni 5 dakikada kur", desc: "Slot tasarımını seç, kazanma oranını ayarla, ödüllerini gir. QR'ı yazdır, masaya koy." },
            { n: "2", emoji: "📸", title: "Müşterin fişini taratsın", desc: "Hesap ödendikten sonra QR ile /play sayfasına gelir, fişini tarar. AI fişi doğrular, jeton verir." },
            { n: "3", emoji: "🎰", title: "Slot çevir, kupon kazan", desc: "Çark döner, jackpot kazanırsa kupon çıkar. Garson kuponu kullandı işaretler." },
          ].map((s) => (
            <div key={s.n} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,216,78,0.15)", borderRadius: 18, padding: "28px 22px", position: "relative" }}>
              <div style={{ position: "absolute", top: -16, left: 22, width: 32, height: 32, borderRadius: "50%", background: "#ffd84e", color: "#111", fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.emoji}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,248,224,0.55)", lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "60px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={sectionTitle}>Basit Fiyatlandırma</h2>
        <p style={{ textAlign: "center", color: "rgba(255,248,224,0.55)", maxWidth: 540, margin: "12px auto 40px", fontSize: 15 }}>
          Küçük işletmeler için Kampanya, müşteri verisi tutmak isteyenler için Pro.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>

          {/* Standard */}
          <div style={pricingCard}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(255,248,224,0.5)", textTransform: "uppercase", marginBottom: 8 }}>Kampanya</div>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>₺499<span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,248,224,0.4)" }}>/ay</span></div>
            <p style={{ fontSize: 13, color: "rgba(255,248,224,0.55)", margin: "12px 0 24px", lineHeight: 1.5 }}>
              Anonim oyun akışı. Müşteri hesabı yok, basit kupon dağıtımı.
            </p>
            <ul style={featList}>
              <li>✓ Sınırsız fiş tarama</li>
              <li>✓ AI ile fiş doğrulama</li>
              <li>✓ 3 slot tasarımı (Klasik / Neon / Deco)</li>
              <li>✓ Garson redemption paneli</li>
              <li>✓ Temel istatistikler</li>
            </ul>
            <Link href={user ? "/dashboard" : "/signup?plan=kampanya"} style={{ ...secondaryBtn, marginTop: 20, width: "100%", display: "block", textAlign: "center", padding: "12px" }}>
              {user ? "Panelde Başla" : "Ücretsiz Başla"}
            </Link>
          </div>

          {/* Pro */}
          <div style={{ ...pricingCard, border: "1.5px solid #ffd84e", boxShadow: "0 0 40px rgba(255,216,78,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", color: "#ffd84e", textTransform: "uppercase" }}>Pro</div>
              <span style={{ padding: "3px 10px", borderRadius: 999, background: "#ffd84e", color: "#111", fontSize: 10, fontWeight: 800 }}>POPÜLER</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>₺1.299<span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,248,224,0.4)" }}>/ay</span></div>
            <p style={{ fontSize: 13, color: "rgba(255,248,224,0.55)", margin: "12px 0 24px", lineHeight: 1.5 }}>
              Müşteri hesabı + sadakat sistemi + kampanya gönderimi.
            </p>
            <ul style={featList}>
              <li>✓ Kampanya planındaki her şey</li>
              <li>✓ Müşteri hesapları (e-posta giriş)</li>
              <li>✓ Profil + kupon geçmişi</li>
              <li>✓ Sadakat seviyesi (Bronze/Silver/Gold)</li>
              <li>✓ Kampanya gönderici (kitle filtreli)</li>
              <li>✓ Detaylı analytics dashboard</li>
              <li>✓ CSV export</li>
            </ul>
            <Link href={user ? "/dashboard" : "/signup?plan=pro"} style={{ ...primaryBtn, marginTop: 20, width: "100%", display: "block", textAlign: "center", padding: "12px" }}>
              {user ? "Panelde Pro'ya Geç" : "Pro Hesap Aç"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{ padding: "60px 24px 40px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 60 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#ffd84e", marginBottom: 6 }}>Shotpot</div>
        <p style={{ fontSize: 13, color: "rgba(255,248,224,0.5)", margin: "0 0 14px" }}>
          Receipt Reward · Gamified loyalty platform for bars &amp; restaurants
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 14 }}>
          <Link href="/terms"   style={{ fontSize: 12, color: "rgba(255,248,224,0.4)", textDecoration: "none" }}>Terms of Service</Link>
          <Link href="/privacy" style={{ fontSize: 12, color: "rgba(255,248,224,0.4)", textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/refund"  style={{ fontSize: 12, color: "rgba(255,248,224,0.4)", textDecoration: "none" }}>Refund Policy</Link>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,248,224,0.3)", margin: 0 }}>
          © {new Date().getFullYear()} Nubit Technology · <a href="mailto:hello@nubit.tech" style={{ color: "#ffd84e", textDecoration: "none" }}>hello@nubit.tech</a>
        </p>
      </footer>
    </div>
  );
}

const navLink: React.CSSProperties = {
  color: "rgba(255,248,224,0.7)", fontSize: 13, fontWeight: 600, textDecoration: "none",
};
const primaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, background: "#ffd84e", color: "#111",
  fontSize: 13, fontWeight: 800, textDecoration: "none", display: "inline-block",
};
const secondaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", color: "#fff8e0",
  fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-block",
};
const sectionTitle: React.CSSProperties = {
  margin: 0, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, textAlign: "center", letterSpacing: "-0.02em",
};
const pricingCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20, padding: "32px 28px",
};
const featList: React.CSSProperties = {
  listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8,
  fontSize: 13, color: "rgba(255,248,224,0.75)",
};
