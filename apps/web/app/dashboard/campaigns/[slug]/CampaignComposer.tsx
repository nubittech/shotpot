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

export function CampaignComposer({ slug, venueName, audiences }: { slug: string; venueName: string; audiences: Audiences }) {
  const router = useRouter();
  const copy = getClientCopy().dashboardPages.campaigns;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("consented");
  const [withGift, setWithGift] = useState(false);
  const [reward, setReward] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (audiences[audience] === 0) {
      setMsg({ ok: false, text: copy.noCustomers });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, title, body, audience,
          reward_label: withGift && reward ? reward : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? copy.sendError });
        return;
      }
      setMsg({ ok: true, text: copy.sendSuccess.replace("{n}", String(data.sentCount)) + (data.withCoupons ? copy.sendSuccessCoupons : "") });
      setTitle(""); setBody(""); setReward("");
      setTimeout(() => router.refresh(), 800);
    } catch {
      setMsg({ ok: false, text: copy.networkError });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Audience selector */}
      <div>
        <label style={labelStyle}>{copy.audienceLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          {(Object.keys(AUDIENCE_EMOJI) as Audience[]).map((a) => {
            const cfg = copy.audience[a];
            const emoji = AUDIENCE_EMOJI[a];
            const cnt = audiences[a];
            const sel = audience === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                style={{
                  padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  background: sel ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${sel ? "#a78bfa" : "rgba(255,255,255,0.08)"}`,
                  color: "#f4efe6",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{emoji} {cfg.label}</div>
                <div style={{ fontSize: 10, color: "rgba(244,239,230,0.5)", marginTop: 3 }}>{cfg.desc}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: sel ? "#a78bfa" : "#ffd84e", marginTop: 6 }}>{cnt}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>{copy.titleLabel}</label>
        <input
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={copy.titlePlaceholder.replace("{venue}", venueName)}
          style={inputStyle}
        />
        <div style={charCount}>{title.length}/80</div>
      </div>

      {/* Body */}
      <div>
        <label style={labelStyle}>{copy.messageLabel}</label>
        <textarea
          required
          maxLength={400}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={copy.messagePlaceholder}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
        />
        <div style={charCount}>{body.length}/400</div>
      </div>

      {/* Gift coupon */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={withGift}
            onChange={(e) => setWithGift(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#a78bfa" }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f4efe6" }}>{copy.giftCheckbox}</span>
          <span style={{ fontSize: 11, color: "rgba(244,239,230,0.4)" }}>{copy.giftHint}</span>
        </label>
        {withGift && (
          <input
            required
            maxLength={60}
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder={copy.rewardPlaceholder}
            style={{ ...inputStyle, marginTop: 10 }}
          />
        )}
      </div>

      {/* Status */}
      {msg && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: msg.ok ? "rgba(74,222,128,0.1)" : "rgba(255,100,80,0.1)",
          border: msg.ok ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,100,80,0.3)",
          color: msg.ok ? "#4ade80" : "#ff8060",
        }}>
          {msg.text}
        </div>
      )}

      {/* Send */}
      <button
        type="submit"
        disabled={busy || !title || !body || (withGift && !reward)}
        style={{
          padding: "14px 24px", borderRadius: 12, border: "none",
          background: "#a78bfa", color: "#111", fontSize: 14, fontWeight: 800, cursor: "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? copy.sending : copy.sendTo.replace("{n}", String(audiences[audience]))}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(244,239,230,0.55)", textTransform: "uppercase", marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#f4efe6", fontSize: 13, outline: "none" };
const charCount: React.CSSProperties = { fontSize: 10, color: "rgba(244,239,230,0.35)", textAlign: "right", marginTop: 4 };
