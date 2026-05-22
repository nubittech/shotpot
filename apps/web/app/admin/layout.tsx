import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  // Forbidden users see the marketing site, not a 403 page.
  if (!admin) redirect("/");

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e8e8", fontFamily: "system-ui, sans-serif" }}>
      <header style={{
        borderBottom: "1px solid #1a1a1a",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 24,
        background: "#0f0f0f",
      }}>
        <Link href="/admin" style={{ color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 16 }}>
          SnapJack · Admin
        </Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <Link href="/admin"           style={navStyle}>Dashboard</Link>
          <Link href="/admin/venues"    style={navStyle}>Venues</Link>
          <Link href="/admin/customers" style={navStyle}>Customers</Link>
          <Link href="/admin/audit"     style={navStyle}>Audit</Link>
        </nav>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>{admin.email}</div>
      </header>
      <main style={{ padding: "24px", maxWidth: 1280, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  color: "#bdbdbd", textDecoration: "none",
};
