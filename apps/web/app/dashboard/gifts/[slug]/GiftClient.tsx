"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientCopy } from "../../../../lib/i18n/client";
import {
  getWheelSegmentDefs,
  segLabel,
  segDefaultPrize,
  type WheelVariantKey,
} from "../../../../components/wheel/segments";

const WHEEL_VARIANTS: WheelVariantKey[] = ["boho", "irish", "medit", "paris", "chalk"];
type SegCfg = { reward: string; coupon: string; share: number };

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
  const clientCopy = getClientCopy();
  const copy = clientCopy.dashboardPages.gifts;
  const variantLabels = clientCopy.studio.wheelVariants;
  const locale: "tr" | "en" = clientCopy.meta.lang === "en" ? "en" : "tr";
  const [audience, setAudience] = useState<Audience>("all");
  const [count, setCount] = useState(1);
  const [daily, setDaily] = useState(initialDaily);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ---- Gift wheel setup ----
  const [variant, setVariant] = useState<WheelVariantKey>("boho");
  const [cfg, setCfg] = useState<Record<string, SegCfg>>({});
  const [savingWheel, setSavingWheel] = useState(false);
  const [wheelMsg, setWheelMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Load existing config on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/gift-wheel?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { variant?: WheelVariantKey; cfg?: Record<string, SegCfg> };
        if (!alive) return;
        if (data.variant) setVariant(data.variant);
        setCfg(data.cfg ?? {});
      } catch {
        /* ignore */
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  // For the selected variant, ensure every prize/jackpot segment has a cfg entry.
  function cfgFor(segId: string): SegCfg {
    return cfg[segId] ?? { reward: "", coupon: "", share: 1 };
  }

  function updateSeg(segId: string, patch: Partial<SegCfg>) {
    setCfg((prev) => ({ ...prev, [segId]: { ...cfgFor(segId), ...patch } }));
  }

  const prizeDefs = getWheelSegmentDefs(variant).filter((s) => s.type !== "lose");
  const totalShare = prizeDefs.reduce((s, d) => s + Number(cfgFor(d.id).share || 0), 0);

  async function saveWheel() {
    const payloadCfg: Record<string, SegCfg> = {};
    for (const d of prizeDefs) {
      const c = cfgFor(d.id);
      payloadCfg[d.id] = { reward: c.reward, coupon: c.coupon || d.defaultCoupon, share: Number(c.share || 0) };
    }
    if (!prizeDefs.some((d) => Number(cfgFor(d.id).share || 0) > 0)) {
      setWheelMsg({ ok: false, text: copy.noPrizeError });
      return;
    }
    setSavingWheel(true);
    setWheelMsg(null);
    try {
      const res = await fetch("/api/dashboard/gift-wheel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, variant, cfg: payloadCfg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWheelMsg({ ok: false, text: data.error ?? copy.saveError });
      } else {
        setCfg(payloadCfg);
        setWheelMsg({ ok: true, text: copy.saved });
      }
    } catch {
      setWheelMsg({ ok: false, text: copy.connectionError });
    } finally {
      setSavingWheel(false);
    }
  }

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

      {/* Gift wheel setup */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{copy.wheelSetupTitle}</div>
        <div style={{ fontSize: 12, color: "rgba(244,239,230,0.55)", marginBottom: 16, lineHeight: 1.5 }}>{copy.wheelSetupHelp}</div>

        {/* Variant picker */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{copy.wheelType}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {WHEEL_VARIANTS.map((vk) => {
            const active = variant === vk;
            return (
              <button
                key={vk}
                onClick={() => { setVariant(vk); setWheelMsg(null); }}
                style={{
                  padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: active ? "rgba(255,216,78,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${active ? "#ffd84e" : "rgba(255,255,255,0.08)"}`,
                  color: active ? "#ffd84e" : "#f4efe6",
                }}
              >
                {variantLabels[vk].label}
              </button>
            );
          })}
        </div>

        {/* Segment list */}
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {getWheelSegmentDefs(variant).map((seg) => {
            if (seg.type === "lose") {
              return (
                <div key={seg.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.45 }}>
                  <span style={{ fontSize: 18 }}>{seg.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{segLabel(seg, locale)}</span>
                  <span style={{ fontSize: 13, color: "rgba(244,239,230,0.5)" }}>— {copy.noWin}</span>
                </div>
              );
            }
            const c = cfgFor(seg.id);
            const share = Number(c.share || 0);
            const pct = totalShare > 0 ? Math.round((share / totalShare) * 100) : 0;
            return (
              <div key={seg.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr 130px", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 18 }}>{seg.icon}</span>
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{segLabel(seg, locale)}</span>
                  <input
                    type="text"
                    value={c.reward}
                    onChange={(e) => updateSeg(seg.id, { reward: e.target.value })}
                    placeholder={segDefaultPrize(seg, locale) ?? ""}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "#f4efe6", fontSize: 13 }}
                  />
                </div>
                <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(244,239,230,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{copy.probability}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number" min={0} max={100} value={share}
                      onChange={(e) => updateSeg(seg.id, { share: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                      style={{ width: 56, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "#f4efe6", fontSize: 13, textAlign: "right" }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#ffd84e", width: 38, textAlign: "right" }}>%{pct}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {wheelMsg && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13,
            background: wheelMsg.ok ? "rgba(142,242,161,0.1)" : "rgba(255,100,80,0.1)",
            border: `1px solid ${wheelMsg.ok ? "rgba(142,242,161,0.3)" : "rgba(255,100,80,0.3)"}`,
            color: wheelMsg.ok ? "#8ef2a1" : "#ff8060",
          }}>{wheelMsg.text}</div>
        )}

        <button
          onClick={saveWheel}
          disabled={savingWheel}
          style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: "#ffd84e", color: "#1a1208", fontSize: 14, fontWeight: 800,
            cursor: savingWheel ? "default" : "pointer", opacity: savingWheel ? 0.6 : 1,
          }}
        >
          {savingWheel ? copy.saving : copy.saveSetup}
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
