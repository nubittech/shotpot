"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClientCopy } from "../../../../lib/i18n/client";

type Audiences = {
  all: number;
  active30: number;
  dormant30: number;
  loyalty_silver: number;
  loyalty_gold: number;
  consented: number;
};
type Audience = keyof Audiences;

const AUDIENCE_EMOJI: Record<Audience, string> = {
  all: "🌐",
  active30: "✨",
  dormant30: "😴",
  loyalty_silver: "🥈",
  loyalty_gold: "🥇",
  consented: "✅",
};

type Stats = { pending: number; used: number; granted: number; usageRate: number };

export function GiftClient({
  slug, audiences, dailyEnabled: initialDaily, stats,
}: {
  slug: string;
  audiences: Audiences;
  dailyEnabled: boolean;
  stats: Stats;
}) {
  const router = useRouter();
  const copy = getClientCopy().dashboardPages.gifts;
  const [audience, setAudience] = useState<Audience>("all");
  const [count, setCount] = useState(1);
  const [daily, setDaily] = useState(initialDaily);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sendGifts() {
    if (audiences[audience] === 0) {
      setMsg({ ok: false, text: copy.noCustomers });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, audience, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? copy.sendError });
      } else {
        setMsg({ ok: true, text: copy.sendSuccess.replace("{customers}", String(data.customers)).replace("{spins}", String(data.spinsGranted)) });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: copy.connectionError });
    } finally {
      setBusy(false);
    }
  }

  async function toggleDaily(next: boolean) {
    setDaily(next);
    try {
      const res = await fetch("/api/dashboard/gifts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, dailyEnabled: next }),
      });
      if (!res.ok) setDaily(!next);
      else router.refresh();
    } catch {
      setDaily(!next);
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: copy.statPending, value: stats.pending, color: "#ffd84e" },
          { label: copy.statUsed, value: stats.used, color: "#8ef2a1" },
          { label: copy.statUsageRate, value: `%${stats.usageRate}`, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily toggle */}
      <div style={{
        background: daily ? "rgba(255,216,78,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${daily ? "rgba(255,216,78,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16, padding: "18px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{copy.dailyTitle}</div>
          <div style={{ fontSize: 12, color: "rgba(244,239,230,0.55)", marginTop: 4, lineHeight: 1.5, maxWidth: 460 }}>
            {copy.dailyDesc}
          </div>
        </div>
        <button
          onClick={() => toggleDaily(!daily)}
          style={{
            flexShrink: 0, width: 52, height: 30, borderRadius: 999, cursor: "pointer",
            border: "none", position: "relative",
            background: daily ? "#ffd84e" : "rgba(255,255,255,0.15)",
            transition: "background 0.15s",
          }}
          aria-label={copy.dailyAria}
        >
          <span style={{
            position: "absolute", top: 3, left: daily ? 25 : 3,
            width: 24, height: 24, borderRadius: "50%", background: "#0a0a0c",
            transition: "left 0.15s",
          }} />
        </button>
      </div>

      {/* Manual send */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>{copy.manualTitle}</div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{copy.toLabel}</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
          {(Object.keys(AUDIENCE_EMOJI) as Audience[]).map((a) => {
            const meta = copy.audience[a];
            const emoji = AUDIENCE_EMOJI[a];
            const cnt = audiences[a];
            const active = audience === a;
            return (
              <button
                key={a}
                onClick={() => setAudience(a)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  background: active ? "rgba(255,216,78,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${active ? "#ffd84e" : "rgba(255,255,255,0.08)"}`,
                  color: "#f4efe6",
                }}
              >
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{meta.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: "rgba(244,239,230,0.45)" }}>{meta.desc}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: active ? "#ffd84e" : "rgba(244,239,230,0.4)" }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{copy.perPersonLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <input
            type="range" min={1} max={10} value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#ffd84e" }}
          />
          <div style={{ width: 40, textAlign: "right", fontWeight: 800, color: "#ffd84e", fontSize: 16 }}>{count}</div>
        </div>

        {msg && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13,
            background: msg.ok ? "rgba(142,242,161,0.1)" : "rgba(255,100,80,0.1)",
            border: `1px solid ${msg.ok ? "rgba(142,242,161,0.3)" : "rgba(255,100,80,0.3)"}`,
            color: msg.ok ? "#8ef2a1" : "#ff8060",
          }}>{msg.text}</div>
        )}

        <button
          onClick={sendGifts}
          disabled={busy}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: "#ffd84e", color: "#1a1208", fontSize: 14, fontWeight: 800,
            cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? copy.sending : copy.sendTo.replace("{audience}", copy.audience[audience].label)}
        </button>
      </div>
    </div>
  );
}
