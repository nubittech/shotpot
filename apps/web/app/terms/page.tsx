import Link from "next/link";

export const metadata = { title: "Terms of Service — Shotpot" };

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 800, color: "#ffd84e", textDecoration: "none" }}>Shotpot</Link>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: "rgba(244,239,230,0.45)", fontSize: 13, marginBottom: 40 }}>Last updated: May 1, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: `By accessing or using Shotpot ("the Service"), operated by Nubit Technology ("we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.`,
          },
          {
            title: "2. Description of Service",
            body: `Shotpot is a B2B SaaS loyalty platform for bars and restaurants. It provides receipt scanning, AI verification, a gamified reward system, coupon management, customer loyalty tracking, and marketing campaign tools accessible via a web-based dashboard.`,
          },
          {
            title: "3. Subscription Plans",
            body: `Shotpot offers paid subscription plans (Campaign and Pro) billed on a monthly basis. Subscriptions automatically renew until cancelled. Prices are listed on our pricing page and may be updated with 30 days notice.`,
          },
          {
            title: "4. Account Responsibilities",
            body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when registering. You must be 18 years or older to use the Service.`,
          },
          {
            title: "5. Prohibited Use",
            body: `You may not use the Service to violate any applicable laws, infringe intellectual property rights, transmit malicious code, scrape or misuse data, or engage in fraudulent activity. We reserve the right to suspend accounts that violate these terms.`,
          },
          {
            title: "6. Intellectual Property",
            body: `All content, trademarks, and software comprising the Service are owned by or licensed to Nubit Technology. You are granted a limited, non-exclusive, non-transferable license to use the Service for your business purposes during your subscription period.`,
          },
          {
            title: "7. Data and Privacy",
            body: `Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described therein.`,
          },
          {
            title: "8. Limitation of Liability",
            body: `To the maximum extent permitted by law, Nubit Technology shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability shall not exceed the amount paid by you in the three months preceding the claim.`,
          },
          {
            title: "9. Termination",
            body: `We may suspend or terminate your access to the Service at any time for violation of these Terms. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period.`,
          },
          {
            title: "10. Governing Law",
            body: `These Terms shall be governed by and construed in accordance with applicable international law. Any disputes shall be resolved through binding arbitration or the courts of competent jurisdiction.`,
          },
          {
            title: "11. Changes to Terms",
            body: `We reserve the right to modify these Terms at any time. We will notify subscribers via email at least 14 days before material changes take effect. Continued use of the Service after changes constitutes acceptance.`,
          },
          {
            title: "12. Contact",
            body: `For questions about these Terms, contact us at hello@nubit.tech.`,
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
