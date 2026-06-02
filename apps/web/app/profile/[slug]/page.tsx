"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/browser";
import type { CustomerPro, Coupon } from "../../../lib/supabase/types";

type CouponStatus = "active" | "redeemed" | "expired";

type Notification = {
  id: string;
  delivered_at: string;
  opened_at: string | null;
  redeemed_at: string | null;
  coupon_id: string | null;
  marketing_campaigns: {
    title: string;
    body: string;
    reward_label: string | null;
    image_url: string | null;
  } | null;
};

type Tab = "coupons" | "notifications";

function couponStatus(c: Coupon): CouponStatus {
  if (c.redeemed_at) return "redeemed";
  if (c.expires_at && new Date(c.expires_at) < new Date()) return "expired";
  return "active";
}

const LOYALTY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  bronze: { label: "Bronz",  emoji: "🥉", color: "#cd7f32" },
  silver: { label: "Gümüş", emoji: "🥈", color: "#a8a9ad" },
  gold:   { label: "Altın",  emoji: "🥇", color: "#ffd700" },
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerPro | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<CouponStatus | "all">("all");
  const [tab, setTab] = useState<Tab>("coupons");
  const [userEmail, setUserEmail] = useState("");
  // Profile editing (name + birthday) — fixes nameless members and collects
  // birth_date reliably AFTER login (not via fragile sessionStorage round-trip).
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push(`/play/${slug}`); return; }
      setUserEmail(user.email ?? "");

      // Fetch customer via API (uses service role for RLS bypass)
      const res = await fetch("/api/play/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) { router.push(`/play/${slug}`); return; }
      const { customer: c } = await res.json() as { customer: CustomerPro };
      setCustomer(c);

      // Fetch coupons + notifications in parallel
      const [res2, res3] = await Promise.all([
        fetch(`/api/profile/coupons?customerId=${c.id}`),
        fetch(`/api/profile/notifications?customerId=${c.id}`),
      ]);
      if (res2.ok) {
        const data = await res2.json() as { coupons: Coupon[] };
        setCoupons(data.coupons ?? []);
      }
      if (res3.ok) {
        const data = await res3.json() as { notifications: Notification[] };
        setNotifications(data.notifications ?? []);
      }

      setLoading(false);
    }
    load();
  }, [slug, router]);

  async function handleSignOut() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push(`/play/${slug}`);
  }

  function startEdit() {
    if (!customer) return;
    setEditName(customer.full_name ?? "");
    setEditBirth(customer.birth_date ?? "");
    setEditing(true);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/play/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          full_name: editName.trim() || undefined,
          birth_date: editBirth || null,
        }),
      });
      if (res.ok) {
        const { customer: updated } = await res.json() as { customer: CustomerPro };
        setCustomer(updated);
        setEditing(false);
      }
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#ffd84e", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!customer) return null;

  const loyalty = LOYALTY_LABELS[customer.loyalty_tier] ?? LOYALTY_LABELS.bronze;
  const filtered = filter === "all" ? coupons : coupons.filter((c) => couponStatus(c) === filter);
  const activeCnt = coupons.filter((c) => couponStatus(c) === "active").length;
  const redeemedCnt = coupons.filter((c) => couponStatus(c) === "redeemed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.push(`/play/${slug}`)} style={ghostBtn}>‹ Oyuna Dön</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffd84e" }}>Profilim</div>
        <button onClick={handleSignOut} style={{ ...ghostBtn, color: "rgba(244,239,230,0.4)" }}>Çıkış</button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>

        {/* Profile card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            {/* Avatar */}
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #ffd84e, #ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#111", flexShrink: 0 }}>
              {(customer.full_name ?? userEmail).slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f4efe6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {customer.full_name ?? "İsimsiz Üye"}
                </div>
                {!editing && (
                  <button onClick={startEdit} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(244,239,230,0.5)", padding: 0, flexShrink: 0 }} aria-label="Düzenle">✏️</button>
                )}
              </div>
              <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", marginTop: 2 }}>{userEmail}</div>
            </div>
            {/* Loyalty badge */}
            <div style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: `1px solid ${loyalty.color}40`, fontSize: 12, fontWeight: 700, color: loyalty.color, flexShrink: 0 }}>
              {loyalty.emoji} {loyalty.label}
            </div>
          </div>

          {/* Edit form — name + birthday */}
          {editing && (
            <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ad Soyad</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Adın"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 6, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#f4efe6", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Doğum Günü</label>
                <input type="date" value={editBirth} onChange={(e) => setEditBirth(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 6, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#f4efe6", fontSize: 14, outline: "none" }} />
                <div style={{ fontSize: 11, color: "rgba(244,239,230,0.4)", marginTop: 6 }}>🎂 Doğum gününde sürpriz ödül için</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveProfile} disabled={savingProfile} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#ffd84e", border: "none", color: "#111", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: savingProfile ? 0.6 : 1 }}>
                  {savingProfile ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button onClick={() => setEditing(false)} disabled={savingProfile} style={{ padding: "11px 18px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(244,239,230,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Ziyaret", value: customer.total_visits },
              { label: "Aktif Kupon", value: activeCnt },
              { label: "Kullanıldı", value: redeemedCnt },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#ffd84e" }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(244,239,230,0.45)", marginTop: 2, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {customer.total_spend > 0 && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,216,78,0.06)", border: "1px solid rgba(255,216,78,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", fontWeight: 600 }}>Toplam Harcama</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#ffd84e" }}>
                ₺{customer.total_spend.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, padding: 4, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
          <button onClick={() => setTab("coupons")} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
            background: tab === "coupons" ? "#ffd84e" : "transparent",
            color: tab === "coupons" ? "#111" : "rgba(244,239,230,0.6)",
          }}>
            🎟 Kuponlarım ({activeCnt})
          </button>
          <button onClick={() => setTab("notifications")} style={{
            flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
            background: tab === "notifications" ? "#a78bfa" : "transparent",
            color: tab === "notifications" ? "#111" : "rgba(244,239,230,0.6)",
            position: "relative",
          }}>
            📬 Bildirimler ({notifications.filter((n) => !n.opened_at).length > 0 ? notifications.length : notifications.length})
            {notifications.filter((n) => !n.opened_at).length > 0 && (
              <span style={{ position: "absolute", top: 4, right: 8, width: 8, height: 8, background: "#ff4040", borderRadius: "50%" }} />
            )}
          </button>
        </div>

        {/* Notifications tab */}
        {tab === "notifications" && (
          <div>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(244,239,230,0.35)", fontSize: 14 }}>
                Henüz bildirim yok. Kampanyalar burada görünecek.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.map((n) => {
                  const camp = n.marketing_campaigns;
                  if (!camp) return null;
                  const unread = !n.opened_at;
                  return (
                    <div key={n.id} onClick={async () => {
                      if (!n.opened_at) {
                        await fetch("/api/profile/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliveryId: n.id }) });
                        setNotifications((arr) => arr.map((x) => x.id === n.id ? { ...x, opened_at: new Date().toISOString() } : x));
                      }
                    }} style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${unread ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                      position: "relative",
                    }}>
                      {unread && <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, background: "#a78bfa", borderRadius: "50%" }} />}
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#f4efe6", marginBottom: 4, paddingRight: 16 }}>{camp.title}</div>
                      <div style={{ fontSize: 13, color: "rgba(244,239,230,0.7)", lineHeight: 1.5, marginBottom: 8 }}>{camp.body}</div>
                      {camp.reward_label && (
                        <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.4)", fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>
                          🎁 {camp.reward_label}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "rgba(244,239,230,0.4)", marginTop: 4 }}>
                        {new Date(n.delivered_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Coupons tab */}
        {tab === "coupons" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Kuponlarım</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "active", "redeemed", "expired"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: filter === f ? "#ffd84e" : "rgba(255,255,255,0.06)",
                  color: filter === f ? "#111" : "rgba(244,239,230,0.6)",
                  border: "none",
                }}>
                  {f === "all" ? "Tümü" : f === "active" ? "Aktif" : f === "redeemed" ? "Kullanıldı" : "Süresi Geçti"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "rgba(244,239,230,0.35)", fontSize: 14 }}>
              {filter === "active" ? "Aktif kuponun yok — fiş tarayarak kazan!" : "Bu kategoride kupon bulunamadı."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((c) => {
                const status = couponStatus(c);
                const statusColor = status === "active" ? "#4ade80" : status === "redeemed" ? "rgba(244,239,230,0.35)" : "#ff8060";
                return (
                  <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${status === "active" ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: status === "expired" ? 0.55 : 1 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f4efe6", marginBottom: 4 }}>{c.reward_label}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(244,239,230,0.5)", letterSpacing: "0.12em" }}>{c.code}</div>
                      <div style={{ fontSize: 11, color: "rgba(244,239,230,0.35)", marginTop: 4 }}>
                        {new Date(c.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, marginLeft: 12 }}>
                      {status === "active" ? "✓ Aktif" : status === "redeemed" ? "Kullanıldı" : "Süresi Geçti"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, padding: "0 4px", display: "flex", justifyContent: "center" }}>
          <button onClick={handleSignOut} style={{ fontSize: 12, color: "rgba(244,239,230,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Hesabımdan çıkış yap
          </button>
        </div>
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  fontSize: 13, fontWeight: 600, color: "rgba(244,239,230,0.6)", padding: "6px 0",
};
