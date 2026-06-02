"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getClientCopy } from "../../lib/i18n/client";
import { getCopy, type Locale } from "../../lib/i18n";

type CouponInfo = {
  valid: boolean;
  code?: string;
  rewardLabel?: string;
  redeemedAt?: string | null;
  reason?: string;
};

export default function ScanPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0c" }} />}>
      <ScanInner />
    </Suspense>
  );
}

function ScanInner() {
  const searchParams = useSearchParams();
  const venueSlug = searchParams.get("venue");
  const [locale, setLocale] = useState<Locale>(() => getClientCopy().meta.lang as Locale);
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<CouponInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const venueQS = venueSlug ? `?venue=${encodeURIComponent(venueSlug)}` : "";

  async function lookup() {
    if (!code.trim()) return;
    setBusy(true); setErr(null); setInfo(null);
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code.trim())}/redeem${venueQS}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.reason === "not_found" ? scanCopy.notFound
          : data?.reason === "wrong_venue" ? scanCopy.notFound
          : (data?.error ?? scanCopy.error));
        return;
      }
      setInfo(data);
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!code.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code.trim())}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue: venueSlug ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.reason === "already_redeemed") setErr(scanCopy.alreadyRedeemed);
        else if (data?.reason === "not_found" || data?.reason === "wrong_venue") setErr(scanCopy.notFound);
        else setErr(data?.error ?? scanCopy.error);
        return;
      }
      setInfo({ valid: false, code: data.code, rewardLabel: data.rewardLabel, redeemedAt: data.redeemedAt });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCode(""); setInfo(null); setErr(null);
  }

  const usable = info?.valid && !info?.redeemedAt;
  const scanCopy = getCopy(locale).scan;

  useEffect(() => {
    if (!venueSlug) return;
    let cancelled = false;
    fetch(`/api/play/venue-language?slug=${encodeURIComponent(venueSlug)}`)
      .then((res) => res.json())
      .then((data: { language?: string }) => {
        if (!cancelled && (data.language === "tr" || data.language === "en")) setLocale(data.language);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [venueSlug]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#f4efe6", padding: 24, fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: 420, marginTop: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#ffd84e", textTransform: "uppercase" }}>{scanCopy.staffPanel}</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 800 }}>{scanCopy.title}</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(244,239,230,0.5)" }}>{scanCopy.subtitle}</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder={scanCopy.placeholder}
              style={{ flex: 1, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f4efe6", fontSize: 15, fontFamily: "monospace", letterSpacing: "0.08em", outline: "none" }}
            />
            <button onClick={lookup} disabled={busy || !code.trim()} style={primaryBtn}>{scanCopy.check}</button>
          </div>

          {err && (
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(255,126,90,0.1)", border: "1px solid rgba(255,126,90,0.3)", color: "#ff9d80", fontSize: 13, fontWeight: 600 }}>
              ⚠ {err}
            </div>
          )}

          {info && (
            <div style={{ marginTop: 16, padding: 18, borderRadius: 12, background: usable ? "rgba(142,242,161,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${usable ? "rgba(142,242,161,0.3)" : "rgba(255,255,255,0.08)"}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: usable ? "#8ef2a1" : "rgba(244,239,230,0.5)" }}>
                {usable ? scanCopy.valid : info.redeemedAt ? scanCopy.used : scanCopy.invalid}
              </div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>{info.rewardLabel}</div>
              <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 12, color: "rgba(244,239,230,0.5)" }}>{info.code}</div>
              {info.redeemedAt && (
                <div style={{ marginTop: 6, fontSize: 11, color: "rgba(244,239,230,0.45)" }}>
                  {scanCopy.redeemedAt}: {new Date(info.redeemedAt).toLocaleString(getCopy(locale).meta.locale)}
                </div>
              )}
              {usable && (
                <button onClick={redeem} disabled={busy} style={{ ...primaryBtn, marginTop: 14, width: "100%" }}>
                  {busy ? scanCopy.processing : scanCopy.markUsed}
                </button>
              )}
            </div>
          )}

          {(info || err) && (
            <button onClick={reset} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(244,239,230,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {scanCopy.newSearch}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "14px 18px", borderRadius: 10,
  background: "#ffd84e", border: "none", color: "#111",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
};
