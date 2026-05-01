import Link from "next/link";

export const metadata = { title: "Refund Policy — Shotpot" };

export default function RefundPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px" }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 800, color: "#ffd84e", textDecoration: "none" }}>Shotpot</Link>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Refund Policy</h1>
        <p style={{ color: "rgba(244,239,230,0.45)", fontSize: 13, marginBottom: 40 }}>Last updated: May 1, 2026</p>

        {[
          {
            title: "14-Day Money-Back Guarantee",
            body: `If you are not satisfied with Shotpot for any reason, you may request a full refund within 14 days of your first payment. To request a refund, email hello@nubit.tech with your account email and reason. Refunds are processed within 5–10 business days to your original payment method.`,
          },
          {
            title: "Renewals",
            body: `Subscription renewals are not eligible for a refund unless required by applicable law. We send a reminder email 7 days before each renewal. You may cancel at any time before the renewal date to avoid being charged for the next period.`,
          },
          {
            title: "How to Cancel",
            body: `You can cancel your subscription at any time from your billing dashboard (Dashboard → Plan → Manage Subscription) or by emailing hello@nubit.tech. Cancellation takes effect at the end of the current billing period; you retain access until then.`,
          },
          {
            title: "Exceptions",
            body: `Refunds may be declined if: the account was suspended for Terms of Service violations; the 14-day window has passed; or the refund request is for a renewal charge where the account was not cancelled before the renewal date.`,
          },
          {
            title: "Contact",
            body: `For refund requests or billing questions, contact us at hello@nubit.tech. We aim to respond within 1 business day.`,
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
