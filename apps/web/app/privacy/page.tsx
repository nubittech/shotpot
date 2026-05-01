import Link from "next/link";

export const metadata = { title: "Privacy Policy — Shotpot" };

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px" }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 800, color: "#ffd84e", textDecoration: "none" }}>Shotpot</Link>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "rgba(244,239,230,0.45)", fontSize: 13, marginBottom: 40 }}>Last updated: May 1, 2026</p>

        {[
          {
            title: "1. Information We Collect",
            body: `We collect information you provide when creating an account (name, email address), information about your venue (name, location), transaction data (receipts scanned, amounts), customer loyalty data (if using Pro tier), and usage data (login times, feature usage). We also collect technical data such as IP addresses and browser type via standard server logs.`,
          },
          {
            title: "2. How We Use Your Information",
            body: `We use collected information to: provide and improve the Service; process subscription payments; send transactional emails (receipts, invoices, account alerts); provide customer support; analyze usage patterns to improve features; and comply with legal obligations.`,
          },
          {
            title: "3. Data Sharing",
            body: `We do not sell your personal data. We share data with: payment processors (Paddle) to handle billing; Supabase for database hosting; Anthropic for AI receipt analysis (receipt images are processed but not stored by Anthropic); Vercel for web hosting. All processors are contractually bound to protect your data.`,
          },
          {
            title: "4. Customer Data (Pro Tier)",
            body: `If you use our Pro tier, you may collect end-customer data (names, emails, visit history) through our platform. You are the data controller for this customer data. We process it on your behalf as a data processor. You are responsible for obtaining appropriate consent from your customers.`,
          },
          {
            title: "5. Data Retention",
            body: `We retain account data for the duration of your subscription plus 90 days after cancellation. Receipt scan images are not stored after processing. You may request deletion of your data at any time by contacting hello@nubit.tech.`,
          },
          {
            title: "6. Security",
            body: `We implement industry-standard security measures including encryption in transit (TLS), encrypted database storage, and access controls. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security.`,
          },
          {
            title: "7. Cookies",
            body: `We use essential session cookies for authentication and functionality. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, though some features may not function correctly.`,
          },
          {
            title: "8. Your Rights",
            body: `Depending on your jurisdiction, you may have the right to access, correct, delete, or export your personal data; object to processing; and lodge a complaint with a data protection authority. To exercise these rights, contact hello@nubit.tech.`,
          },
          {
            title: "9. International Transfers",
            body: `Your data may be processed in countries outside your own. We ensure appropriate safeguards are in place for any international transfers in accordance with applicable data protection law.`,
          },
          {
            title: "10. Contact",
            body: `For privacy-related questions or requests, contact our team at hello@nubit.tech.`,
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffd84e", marginBottom: 10 }}>{title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(244,239,230,0.7)", margin: 0 }}>{body}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
