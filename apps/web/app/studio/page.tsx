"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SYMBOL_REGISTRY, type SymId } from "../../components/slot/Symbols";
import type { SlotVariant } from "../../components/SlotMachine";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any;
    __shotpotPaddleInitialized?: boolean;
  }
}

/* ─── Constants ──────────────────────────────────────────────── */
const SELECTABLE_SYMS: SymId[] = ["beer", "wine", "shot", "martini", "cocktail", "bar"];
const MAX_SYMBOLS = 5;
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const BUSINESS_ID = "default-business";

const VARIANTS: { id: SlotVariant; label: string; desc: string; bg: string; accent: string; preview: string }[] = [
  {
    id: "v1",
    label: "Classic",
    desc: "Sıcak ahşap tonlar, retro kol mekanizması",
    bg: "linear-gradient(135deg, #2a1206 0%, #3e1c0a 100%)",
    accent: "#c8841d",
    preview: "🎰",
  },
  {
    id: "v2",
    label: "Neon",
    desc: "Karanlık zemin, pembe-mor neon ışıklar",
    bg: "linear-gradient(135deg, #0a0014 0%, #1a0030 100%)",
    accent: "#ff2d8a",
    preview: "⚡",
  },
  {
    id: "v3",
    label: "Art Déco",
    desc: "Altın çizgiler, krem zemin, klasik şıklık",
    bg: "linear-gradient(135deg, #1a1208 0%, #2a1e0a 100%)",
    accent: "#caa14a",
    preview: "✦",
  },
];

const STEP_LABELS = [
  "Slot Tasarımı",
  "İşletme Bilgileri",
  "Semboller & Ödüller",
  "Kazanma Oranları",
  "Önizleme & Kaydet",
];

/* ─── Types ──────────────────────────────────────────────────── */
type SymCfg = { reward: string; coupon: string; share: number };
type Currency = "TRY" | "USD" | "EUR";
type ReceiptMode = "ocr" | "qr" | "both";
type InterfaceLanguage = "tr" | "en";

const CURRENCY_META: Record<Currency, { symbol: string; label: string; defaultThreshold: number; defaultTimezone: string }> = {
  TRY: { symbol: "₺", label: "Türk Lirası (₺)", defaultThreshold: 50, defaultTimezone: "Europe/Istanbul" },
  USD: { symbol: "$", label: "Dolar ($)",         defaultThreshold: 3,  defaultTimezone: "America/New_York" },
  EUR: { symbol: "€", label: "Euro (€)",           defaultThreshold: 3,  defaultTimezone: "Europe/Berlin" },
};

const TIMEZONES: Array<{ tz: string; label: string }> = [
  { tz: "Europe/Istanbul",   label: "İstanbul (UTC+3)" },
  { tz: "Europe/London",     label: "Londra (UTC+0/+1)" },
  { tz: "Europe/Berlin",     label: "Berlin (UTC+1/+2)" },
  { tz: "Europe/Paris",      label: "Paris (UTC+1/+2)" },
  { tz: "Europe/Madrid",     label: "Madrid (UTC+1/+2)" },
  { tz: "Europe/Amsterdam",  label: "Amsterdam (UTC+1/+2)" },
  { tz: "America/New_York",  label: "New York (UTC-5/-4)" },
  { tz: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { tz: "America/Chicago",   label: "Chicago (UTC-6/-5)" },
  { tz: "Asia/Dubai",        label: "Dubai (UTC+4)" },
  { tz: "Asia/Tokyo",        label: "Tokyo (UTC+9)" },
  { tz: "Asia/Singapore",    label: "Singapur (UTC+8)" },
];

type State = {
  step: number;
  variant: SlotVariant;
  name: string;
  slug: string;
  plan: "kampanya" | "isletme";
  billingCycle: "monthly" | "yearly";
  currency: Currency;
  receiptMode: ReceiptMode;
  interfaceLanguage: InterfaceLanguage;
  timezone: string;
  tokenThreshold: number;
  selected: SymId[];
  symCfg: Partial<Record<SymId, SymCfg>>;
  jackpotReward: string;
  jackpotCoupon: string;
  winRate: number;
  jackpotShare: number;
  saving: boolean;
  saved: boolean;
};

const DEFAULT_CFG: Partial<Record<SymId, SymCfg>> = {
  beer:     { reward: "Bira bizden", coupon: "BEER", share: 20 },
  wine:     { reward: "Şarap bizden", coupon: "WINE", share: 20 },
  shot:     { reward: "Shot bizden", coupon: "SHOT", share: 20 },
  martini:  { reward: "Signature martini", coupon: "MART", share: 20 },
  cocktail: { reward: "Ev kokteyliniz", coupon: "CKTL", share: 20 },
  bar:      { reward: "Hesaptan %15 indirim", coupon: "BAR15", share: 20 },
};

/* ─── Helpers ────────────────────────────────────────────────── */
function totalSymShare(selected: SymId[], symCfg: Partial<Record<SymId, SymCfg>>) {
  return selected.reduce((s, id) => s + (symCfg[id]?.share ?? 0), 0);
}

function planLabel(plan: State["plan"]) {
  return plan === "kampanya" ? "Kampanya" : "İşletme";
}

function billingLabel(cycle: State["billingCycle"]) {
  return cycle === "yearly" ? "Yıllık" : "Aylık";
}

function planPrice(plan: State["plan"], cycle: State["billingCycle"]) {
  if (plan === "kampanya") return cycle === "yearly" ? "$20/yıl" : "$5/ay";
  return cycle === "yearly" ? "$50/yıl" : "$10/ay";
}

function checkoutPlanFromStudio(plan: State["plan"]) {
  return plan === "kampanya" ? "kampanya" : "pro";
}

function checkoutPeriodFromStudio(cycle: State["billingCycle"]) {
  return cycle === "yearly" ? "annual" : "monthly";
}

function loadPaddleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Paddle) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Paddle script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paddle script failed"));
    document.head.appendChild(script);
  });
}

async function openPaddleCheckoutFromStudio(args: {
  venueId: string;
  slug: string;
  plan: State["plan"];
  billingCycle: State["billingCycle"];
  interfaceLanguage: InterfaceLanguage;
}) {
  const checkoutPlan = checkoutPlanFromStudio(args.plan);
  const checkoutPeriod = checkoutPeriodFromStudio(args.billingCycle);
  const res = await fetch(`/api/paddle/checkout-config?plan=${checkoutPlan}&period=${checkoutPeriod}`);
  if (!res.ok) throw new Error("Paddle checkout config missing");
  const config = await res.json() as {
    environment: "sandbox" | "production";
    clientToken: string;
    priceId: string;
  };

  await loadPaddleScript();
  if (!window.__shotpotPaddleInitialized) {
    if (config.environment === "sandbox") {
      window.Paddle.Environment.set("sandbox");
    }
    window.Paddle.Initialize({ token: config.clientToken, pwCustomer: {} });
    window.__shotpotPaddleInitialized = true;
  }
  window.Paddle.Checkout.open({
    items: [{ priceId: config.priceId, quantity: 1 }],
    customData: { venue_id: args.venueId, plan: checkoutPlan, billing_cycle: checkoutPeriod },
    settings: {
      displayMode: "overlay",
      locale: args.interfaceLanguage,
      successUrl: `${window.location.origin}/dashboard/billing/${args.slug}?success=1`,
    },
  });
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0b0d", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(244,239,230,0.5)", fontFamily: "Inter, sans-serif" }}>Yükleniyor…</div>}>
      <StudioInner />
    </Suspense>
  );
}

function StudioInner() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("slug");

  const [st, setSt] = useState<State>({
    step: 0,
    variant: "v1",
    name: "",
    slug: "",
    plan: "kampanya",
    billingCycle: "monthly",
    currency: "TRY",
    receiptMode: "ocr",
    interfaceLanguage: "tr",
    timezone: "Europe/Istanbul",
    tokenThreshold: 50,
    selected: ["beer", "wine", "shot"],
    symCfg: { ...DEFAULT_CFG },
    jackpotReward: "JACKPOT — açık büfe",
    jackpotCoupon: "JACKPOT",
    winRate: 30,
    jackpotShare: 10,
    saving: false,
    saved: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function update(patch: Partial<State>) {
    setSt((prev) => ({ ...prev, ...patch }));
  }

  // Load existing venue config when ?slug=xxx is present
  useEffect(() => {
    if (!editSlug) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/studio/load?slug=${encodeURIComponent(editSlug)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error ?? "Konfigürasyon yüklenemedi.");
          return;
        }
        const v = data.venue as State extends infer T ? Partial<Record<keyof T, unknown>> : never;
        const cfg = data.config;
        const camps = (data.campaigns ?? []) as Array<{
          symbolId: string; rewardLabel: string; couponPrefix: string; share: number; active: boolean;
        }>;

        const newSelected: SymId[] = [];
        const newCfg: Partial<Record<SymId, SymCfg>> = {};
        for (const c of camps) {
          if ((SELECTABLE_SYMS as string[]).includes(c.symbolId)) {
            const sid = c.symbolId as SymId;
            newSelected.push(sid);
            newCfg[sid] = {
              reward: c.rewardLabel,
              coupon: c.couponPrefix,
              share: Math.round((c.share ?? 0.2) * 100),
            };
          }
        }

        setSt((prev) => ({
          ...prev,
          name:           (v as { name?: string }).name           ?? prev.name,
          slug:           (v as { slug?: string }).slug           ?? prev.slug,
          plan:           ((v as { plan?: string }).plan as State["plan"]) ?? prev.plan,
          billingCycle:   ((v as { billingCycle?: string }).billingCycle as State["billingCycle"]) ?? prev.billingCycle,
          currency:       ((v as { currency?: string }).currency as Currency) ?? prev.currency,
          receiptMode:    ((v as { receiptMode?: string }).receiptMode as ReceiptMode) ?? prev.receiptMode,
          interfaceLanguage: ((v as { interfaceLanguage?: string }).interfaceLanguage as InterfaceLanguage) ?? prev.interfaceLanguage,
          timezone:       (v as { timezone?: string }).timezone   ?? prev.timezone,
          tokenThreshold: (v as { tokenThreshold?: number }).tokenThreshold ?? prev.tokenThreshold,
          variant:        cfg?.variant ?? prev.variant,
          winRate:        cfg ? Math.round(cfg.winRate * 100) : prev.winRate,
          jackpotShare:   cfg ? Math.round(cfg.jackpotShare * 100) : prev.jackpotShare,
          jackpotReward:  cfg?.jackpotReward ?? prev.jackpotReward,
          jackpotCoupon:  cfg?.jackpotCoupon ?? prev.jackpotCoupon,
          selected:       newSelected.length ? newSelected : prev.selected,
          symCfg:         newSelected.length ? newCfg : prev.symCfg,
        }));
      } catch {
        if (!cancelled) setLoadError("Bağlantı hatası.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editSlug]);

  function goTo(step: number) {
    update({ step });
  }

  /* ── Computed probabilities ──────────────────────────────── */
  const probabilities = useMemo(() => {
    const win = st.winRate / 100;
    const jpProb = win * (st.jackpotShare / 100);
    const symWin = win - jpProb;
    const total = totalSymShare(st.selected, st.symCfg);
    return {
      jackpot: jpProb,
      lose: 1 - win,
      symbols: st.selected.map((id) => ({
        id,
        prob: total > 0 ? symWin * ((st.symCfg[id]?.share ?? 0) / total) : 0,
      })),
    };
  }, [st.winRate, st.jackpotShare, st.selected, st.symCfg]);

  /* ── Save ────────────────────────────────────────────────── */
  async function handleSave() {
    update({ saving: true });
    setSaveError(null);
    let checkoutSlug: string | null = null;
    try {
      const rules = [
        {
          name: "Jackpot",
          probability: probabilities.jackpot,
          couponCodePrefix: st.jackpotCoupon,
        },
        ...probabilities.symbols.map(({ id, prob }) => ({
          name: st.symCfg[id]?.reward ?? id,
          probability: prob,
          couponCodePrefix: st.symCfg[id]?.coupon ?? id.toUpperCase(),
        })),
        {
          name: "No Reward",
          probability: probabilities.lose,
          couponCodePrefix: "LOSE",
        },
      ];

      // Always sync to localStorage so main page picks it up instantly
      const localPayload = {
        name: st.name || "İşletme",
        logoSymbol: st.name.slice(0, 2).toUpperCase() || "??",
        slotVariant: st.variant,
        tokenThreshold: st.tokenThreshold,
        plan: st.plan,
        billingCycle: st.billingCycle,
        interfaceLanguage: st.interfaceLanguage,
        planPrice: planPrice(st.plan, st.billingCycle),
        rewards: probabilities.symbols.map(({ id }) => ({
          icon: symEmoji(id),
          label: st.symCfg[id]?.reward ?? id,
        })),
        rules,
      };
      localStorage.setItem("rr_studio_config", JSON.stringify(localPayload));

      // Persist legacy JSON for / page sync
      await fetch("/api/studio-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localPayload),
      }).catch(() => {});

      // Persist to Supabase (venues + symbol_configs + campaigns)
      const sbPayload = {
        slug: st.slug,
        name: st.name || "İşletme",
        plan: st.plan,
        billingCycle: st.billingCycle,
        currency: st.currency,
        receiptMode: st.receiptMode,
        interfaceLanguage: st.interfaceLanguage,
        timezone: st.timezone,
        tokenThreshold: st.tokenThreshold,
        variant: st.variant,
        winRate: st.winRate / 100,
        jackpotShare: st.jackpotShare / 100,
        jackpotReward: st.jackpotReward,
        jackpotCoupon: st.jackpotCoupon,
        campaigns: st.selected.map((id) => ({
          symbolId: id,
          rewardLabel: st.symCfg[id]?.reward ?? id,
          couponPrefix: st.symCfg[id]?.coupon ?? id.toUpperCase(),
          share: (st.symCfg[id]?.share ?? 20) / 100,
        })),
      };
      const sbRes = await fetch("/api/studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sbPayload),
      });
      if (!sbRes.ok) {
        const err = await sbRes.json().catch(() => ({ error: "Konfigürasyon kaydedilemedi." }));
        console.error("Supabase save failed:", err);
        setSaveError(err.error ?? "Konfigürasyon kaydedilemedi. Lütfen tekrar dene.");
        return;
      } else {
        const savedVenue = await sbRes.json().catch(() => null) as { venueId?: string; slug?: string } | null;
        checkoutSlug = savedVenue?.slug ?? st.slug;
        if (savedVenue?.venueId && checkoutSlug) {
          await openPaddleCheckoutFromStudio({
            venueId: savedVenue.venueId,
            slug: checkoutSlug,
            plan: st.plan,
            billingCycle: st.billingCycle,
            interfaceLanguage: st.interfaceLanguage,
          });
          update({ saved: true });
          return;
        }
      }

      if (checkoutSlug) {
        const checkoutPlan = checkoutPlanFromStudio(st.plan);
        const checkoutPeriod = checkoutPeriodFromStudio(st.billingCycle);
        window.location.href = `/dashboard/billing/${checkoutSlug}?checkout=1&plan=${checkoutPlan}&period=${checkoutPeriod}`;
        return;
      }

      await Promise.all([
        fetch(`${API}/business/${BUSINESS_ID}/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: st.name || "İşletme",
            logoSymbol: st.name.slice(0, 2).toUpperCase() || "??",
            headline: "Gecenin Ritmi",
            subheadline: "Modern gastronomi deneyimi",
            background: "#111111",
            surface: "#1c1b1d",
            ink: "#f6f1e3",
            accent: "#ffd84e",
            accentSoft: "#ffd84e",
            rewards: probabilities.symbols.map(({ id }) => ({
              icon: symEmoji(id),
              label: st.symCfg[id]?.reward ?? id,
            })),
            slotVariant: st.variant,
            tokenThreshold: st.tokenThreshold,
          }),
        }),
        fetch(`${API}/business/${BUSINESS_ID}/reward-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules }),
        }),
      ]);
      update({ saved: true });
    } catch (error) {
      console.error("Checkout failed:", error);
      setSaveError(
        "Ödeme ekranı açılamadı. Paddle verification, Vercel env değişkenleri veya tarayıcı pop-up/extension ayarlarını kontrol edip tekrar dene."
      );
    } finally {
      update({ saving: false });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0d", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: "#ffd84e" }}>Receipt Reward</div>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", fontWeight: 500 }}>
          {editSlug ? `Düzenleme · ${editSlug}` : "İşletme Kurulum Paneli"}
        </div>
        {loading && (
          <div style={{ marginLeft: "auto", fontSize: 11, color: "rgba(244,239,230,0.4)" }}>Konfigürasyon yükleniyor…</div>
        )}
        {loadError && (
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#ff7e5a" }}>{loadError}</div>
        )}
      </header>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Step bar */}
        <StepBar current={st.step} labels={STEP_LABELS} onGo={goTo} />

        <div style={{ marginTop: 40 }}>
          {st.step === 0 && <StepVariant st={st} update={update} onNext={() => goTo(1)} />}
          {st.step === 1 && <StepInfo st={st} update={update} onNext={() => goTo(2)} onBack={() => goTo(0)} />}
          {st.step === 2 && <StepSymbols st={st} update={update} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {st.step === 3 && <StepRates st={st} update={update} probabilities={probabilities} onNext={() => goTo(4)} onBack={() => goTo(2)} />}
          {st.step === 4 && <StepPreview st={st} probabilities={probabilities} saving={st.saving} saved={st.saved} saveError={saveError} onSave={handleSave} onBack={() => goTo(3)} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Step Bar ───────────────────────────────────────────────── */
function StepBar({ current, labels, onGo }: { current: number; labels: string[]; onGo: (i: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
            <button
              onClick={() => done && onGo(i)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: done ? "pointer" : "default",
                padding: 0,
              }}
              type="button"
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "#ffd84e" : active ? "rgba(255,216,78,0.15)" : "rgba(255,255,255,0.06)",
                border: active ? "2px solid #ffd84e" : done ? "none" : "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: done ? "#111" : active ? "#ffd84e" : "rgba(255,255,255,0.3)",
                transition: "all 0.2s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                color: active ? "#ffd84e" : done ? "rgba(244,239,230,0.7)" : "rgba(244,239,230,0.3)",
                whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </button>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < current ? "#ffd84e" : "rgba(255,255,255,0.08)", margin: "0 8px", marginBottom: 22, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 0: Variant ────────────────────────────────────────── */
function StepVariant({ st, update, onNext }: { st: State; update: (p: Partial<State>) => void; onNext: () => void }) {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <StepHeader title="Slot Tasarımı Seç" sub="Müşterilerin göreceği slot makinesinin görünümünü belirle. Kurulum sonrası değiştirilebilir." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {VARIANTS.map((v) => {
          const active = st.variant === v.id;
          return (
            <button
              key={v.id}
              onClick={() => update({ variant: v.id })}
              style={{
                background: "none", border: `2px solid ${active ? "#ffd84e" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20, padding: 0, cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s", overflow: "hidden",
                boxShadow: active ? "0 0 0 1px rgba(255,216,78,0.3), 0 0 32px rgba(255,216,78,0.08)" : "none",
              }}
              type="button"
            >
              {/* Preview area */}
              <div style={{ height: 160, background: v.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 40 }}>{v.preview}</div>
                <div style={{
                  padding: "4px 16px", borderRadius: 999,
                  border: `1px solid ${v.accent}44`, background: `${v.accent}22`,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: v.accent,
                }}>
                  {v.label}
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#f4efe6" }}>{v.label}</div>
                <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", marginTop: 4, lineHeight: 1.4 }}>{v.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      <NavRow onNext={onNext} nextLabel="Devam Et" />
    </div>
  );
}

/* ─── Step 1: Info ───────────────────────────────────────────── */
function StepInfo({ st, update, onNext, onBack }: { st: State; update: (p: Partial<State>) => void; onNext: () => void; onBack: () => void }) {
  const meta = CURRENCY_META[st.currency];
  const exampleAmount = st.currency === "TRY" ? 225 : st.currency === "USD" ? 15 : 12;
  const exampleTokens = Math.floor(exampleAmount / st.tokenThreshold);
  const planPrices: Record<State["plan"], Record<State["billingCycle"], string>> = {
    kampanya: { monthly: "$5/ay", yearly: "$20/yıl" },
    isletme: { monthly: "$10/ay", yearly: "$50/yıl" },
  };

  function handleCurrencyChange(c: Currency) {
    update({
      currency: c,
      tokenThreshold: CURRENCY_META[c].defaultThreshold,
      timezone: CURRENCY_META[c].defaultTimezone,
    });
  }

  return (
    <div style={{ display: "grid", gap: 28, maxWidth: 520 }}>
      <StepHeader title="İşletme Bilgileri" sub="Bu bilgiler slot makinenizde ve müşteri arayüzünde görünür." />
      <div style={{ display: "grid", gap: 20 }}>
        <Field label="İşletme Adı" hint="Slot makinesinin üst kısmında büyük harfle gösterilir.">
          <input
            value={st.name}
            onChange={(e) => update({ name: e.target.value, slug: st.slug || autoSlug(e.target.value) })}
            placeholder="Örn. MIDNIGHT TAP"
            maxLength={24}
            style={inputStyle}
          />
        </Field>
        <Field label="URL Slug" hint={`Müşteri linki: /play/${st.slug || "midnight-tap"}`}>
          <input
            value={st.slug}
            onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            placeholder="midnight-tap"
            maxLength={48}
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
          />
        </Field>
        <Field label="Müşteri Arayüz Dili" hint="Fiş okuma, jackpot, kupon ve garson ekranı bu dilde görünür.">
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { id: "tr", label: "Türkçe", sub: "TR" },
              { id: "en", label: "English", sub: "EN" },
            ] as Array<{ id: InterfaceLanguage; label: string; sub: string }>).map((lang) => (
              <button
                key={lang.id}
                onClick={() => update({ interfaceLanguage: lang.id })}
                type="button"
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: st.interfaceLanguage === lang.id ? "rgba(255,216,78,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${st.interfaceLanguage === lang.id ? "#ffd84e" : "rgba(255,255,255,0.1)"}`,
                  color: st.interfaceLanguage === lang.id ? "#ffd84e" : "rgba(244,239,230,0.7)",
                }}
              >
                {lang.label} · {lang.sub}
              </button>
            ))}
          </div>
        </Field>
        <Field
          label="Abonelik Tipi"
          hint={`Seçili paket: ${st.plan === "kampanya" ? "Kampanya" : "İşletme"} · ${planPrices[st.plan][st.billingCycle]}`}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {(["monthly", "yearly"] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => update({ billingCycle: cycle })}
                  type="button"
                  style={{
                    flex: 1, padding: "9px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: st.billingCycle === cycle ? "rgba(255,216,78,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${st.billingCycle === cycle ? "#ffd84e" : "rgba(255,255,255,0.1)"}`,
                    color: st.billingCycle === cycle ? "#ffd84e" : "rgba(244,239,230,0.65)",
                  }}
                >
                  {cycle === "monthly" ? "Aylık" : "Yıllık"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["kampanya", "isletme"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => update({ plan: p })}
                  type="button"
                  style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    background: st.plan === p ? "rgba(255,216,78,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${st.plan === p ? "#ffd84e" : "rgba(255,255,255,0.1)"}`,
                    color: st.plan === p ? "#ffd84e" : "rgba(244,239,230,0.7)",
                  }}
                >
                  {p === "kampanya" ? "Kampanya" : "İşletme"} · {planPrices[p][st.billingCycle]}
                </button>
              ))}
            </div>
          </div>
        </Field>
        {/* Currency selector */}
        <Field label="Para Birimi" hint="Fişten okunan tutar bu para biriminde değerlendirilecek.">
          <div style={{ display: "flex", gap: 8 }}>
            {(["TRY", "USD", "EUR"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                type="button"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: st.currency === c ? "rgba(255,216,78,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${st.currency === c ? "#ffd84e" : "rgba(255,255,255,0.1)"}`,
                  color: st.currency === c ? "#ffd84e" : "rgba(244,239,230,0.6)",
                }}
              >
                {CURRENCY_META[c].symbol} {c}
              </button>
            ))}
          </div>
        </Field>

        {/* Token threshold */}
        <Field
          label="Jeton Kazanma Eşiği"
          hint={`Her ${st.tokenThreshold} ${meta.symbol} harcama = 1 jeton · Örnek: ${exampleAmount} ${meta.symbol} fiş → ${exampleTokens} jeton`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>Her</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={st.tokenThreshold}
              onChange={(e) => update({ tokenThreshold: Math.max(1, Number(e.target.value)) })}
              style={{ ...inputStyle, width: 110 }}
            />
            <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{meta.symbol} = 1 jeton</span>
          </div>
        </Field>

        {/* Timezone */}
        <Field label="Zaman Dilimi" hint="Fiş tarih/saati bu zaman dilimine göre değerlendirilir. 1 saatten eski fişler reddedilir.">
          <select
            value={st.timezone}
            onChange={(e) => update({ timezone: e.target.value })}
            style={{ ...inputStyle, appearance: "auto" }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.tz} value={tz.tz} style={{ background: "#1a1a1c" }}>
                {tz.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Receipt mode */}
        <Field
          label="Fiş Doğrulama Modu"
          hint={
            st.receiptMode === "ocr"   ? "Müşteri fişi fotoğraflar, AI tutarı ve tarihi okur. Tüm POS'larda çalışır."
          : st.receiptMode === "qr"    ? "Sadece QR kodlu fişler kabul edilir. Maksimum güvenlik (Adisyo, Revo, Simpra)."
          : "QR varsa otomatik okunur, yoksa AI fotoğraf okuma devreye girer."
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {([
              { id: "ocr",  label: "Standart",  sub: "Fotoğraf + AI" },
              { id: "qr",   label: "QR",        sub: "POS QR" },
              { id: "both", label: "Otomatik",  sub: "QR → AI" },
            ] as Array<{ id: ReceiptMode; label: string; sub: string }>).map((m) => (
              <button
                key={m.id}
                onClick={() => update({ receiptMode: m.id })}
                type="button"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                  background: st.receiptMode === m.id ? "rgba(255,216,78,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${st.receiptMode === m.id ? "#ffd84e" : "rgba(255,255,255,0.1)"}`,
                  color: st.receiptMode === m.id ? "#ffd84e" : "rgba(244,239,230,0.7)",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{m.sub}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextLabel="Devam Et" nextDisabled={!st.name.trim() || !st.slug.trim()} />
    </div>
  );
}

/* ─── Step 2: Symbols & Rewards ──────────────────────────────── */
function StepSymbols({ st, update, onNext, onBack }: { st: State; update: (p: Partial<State>) => void; onNext: () => void; onBack: () => void }) {
  function toggleSym(id: SymId) {
    const cur = st.selected;
    if (cur.includes(id)) {
      update({ selected: cur.filter((s) => s !== id) });
    } else if (cur.length < MAX_SYMBOLS) {
      update({ selected: [...cur, id] });
    }
  }

  function setCfg(id: SymId, patch: Partial<SymCfg>) {
    update({
      symCfg: {
        ...st.symCfg,
        [id]: { ...(st.symCfg[id] ?? DEFAULT_CFG[id] ?? { reward: "", coupon: "", share: 20 }), ...patch },
      },
    });
  }

  const canNext = st.selected.length > 0 && st.selected.every((id) => st.symCfg[id]?.reward?.trim() && st.symCfg[id]?.coupon?.trim());

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <StepHeader
        title="Semboller & Ödüller"
        sub={`Sembol havuzundan maksimum ${MAX_SYMBOLS} sembol seç. Her sembol üçlemesi için kazanç mesajı ve kupon kodu belirle. Jackpot (7) her zaman aktiftir.`}
      />

      {/* Symbol pool */}
      <div>
        <SectionLabel>Sembol Havuzu ({st.selected.length}/{MAX_SYMBOLS} seçildi)</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {SELECTABLE_SYMS.map((id) => {
            const selected = st.selected.includes(id);
            const sym = SYMBOL_REGISTRY[id];
            const disabled = !selected && st.selected.length >= MAX_SYMBOLS;
            return (
              <button
                key={id}
                onClick={() => toggleSym(id)}
                disabled={disabled}
                type="button"
                style={{
                  background: selected ? "rgba(255,216,78,0.1)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${selected ? "#ffd84e" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 14, padding: "14px 10px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.35 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {sym.render({ size: 48, tone: "warm" })}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: selected ? "#ffd84e" : "rgba(244,239,230,0.6)", textTransform: "capitalize" }}>{id}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reward config per selected symbol */}
      {st.selected.length > 0 && (
        <div>
          <SectionLabel>Ödül Konfigürasyonu</SectionLabel>
          <div style={{ display: "grid", gap: 12 }}>
            {/* Jackpot always */}
            <RewardRow
              icon={<div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{SYMBOL_REGISTRY.seven.render({ size: 40, tone: "warm" })}</div>}
              label="7 · Jackpot"
              isJackpot
              reward={st.jackpotReward}
              coupon={st.jackpotCoupon}
              onReward={(v) => update({ jackpotReward: v })}
              onCoupon={(v) => update({ jackpotCoupon: v })}
            />
            {st.selected.map((id) => (
              <RewardRow
                key={id}
                icon={<div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{SYMBOL_REGISTRY[id].render({ size: 40, tone: "warm" })}</div>}
                label={id.charAt(0).toUpperCase() + id.slice(1)}
                reward={st.symCfg[id]?.reward ?? ""}
                coupon={st.symCfg[id]?.coupon ?? ""}
                onReward={(v) => setCfg(id, { reward: v })}
                onCoupon={(v) => setCfg(id, { coupon: v.toUpperCase() })}
              />
            ))}
          </div>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Devam Et" nextDisabled={!canNext} />
    </div>
  );
}

/* ─── Step 3: Rates ──────────────────────────────────────────── */
function StepRates({
  st, update, probabilities, onNext, onBack,
}: {
  st: State;
  update: (p: Partial<State>) => void;
  probabilities: ReturnType<typeof computeProbs>;
  onNext: () => void;
  onBack: () => void;
}) {
  function setSymShare(id: SymId, val: number) {
    update({
      symCfg: {
        ...st.symCfg,
        [id]: { ...(st.symCfg[id] ?? { reward: "", coupon: "", share: 20 }), share: Math.max(1, val) },
      },
    });
  }

  const symTotal = totalSymShare(st.selected, st.symCfg);

  return (
    <div style={{ display: "grid", gap: 32, maxWidth: 600 }}>
      <StepHeader
        title="Kazanma Oranları"
        sub="Önce genel kazanma oranını belirle, sonra bu kazançları jackpot ve semboller arasında dağıt."
      />

      <div style={{ display: "grid", gap: 24 }}>
        {/* Overall win rate */}
        <Field label={`Genel Kazanma Oranı — %${st.winRate}`} hint="Her spin için kazanma olasılığı">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range" min={5} max={90} step={5}
              value={st.winRate}
              onChange={(e) => update({ winRate: Number(e.target.value) })}
              style={{ flex: 1, accentColor: "#ffd84e" }}
            />
            <div style={{ width: 52, textAlign: "right", fontWeight: 700, color: "#ffd84e", fontSize: 15 }}>%{st.winRate}</div>
          </div>
        </Field>

        {/* Jackpot share */}
        <Field label={`Jackpot Payı — Kazançların %${st.jackpotShare}'i`} hint={`= Her spin için %${((st.winRate * st.jackpotShare) / 100).toFixed(1)} jackpot ihtimali`}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="range" min={1} max={50} step={1}
              value={st.jackpotShare}
              onChange={(e) => update({ jackpotShare: Number(e.target.value) })}
              style={{ flex: 1, accentColor: "#ffd84e" }}
            />
            <div style={{ width: 52, textAlign: "right", fontWeight: 700, color: "#ffd84e", fontSize: 15 }}>%{st.jackpotShare}</div>
          </div>
        </Field>

        {/* Per-symbol share */}
        <div>
          <SectionLabel>Sembol Dağılımı</SectionLabel>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(244,239,230,0.45)", lineHeight: 1.5 }}>
            Her sembolün kazanç payını belirle (göreceli ağırlık). Toplam ağırlığa oranla hesaplanır.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {st.selected.map((id) => {
              const share = st.symCfg[id]?.share ?? 20;
              const prob = probabilities.symbols.find((s) => s.id === id)?.prob ?? 0;
              return (
                <div key={id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px 80px", gap: 10, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.7)" }}>
                    <div style={{ width: 24, height: 24 }}>{SYMBOL_REGISTRY[id].render({ size: 24, tone: "warm" })}</div>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </div>
                  <input
                    type="range" min={1} max={100}
                    value={share}
                    onChange={(e) => setSymShare(id, Number(e.target.value))}
                    style={{ accentColor: "#ffd84e" }}
                  />
                  <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", textAlign: "right" }}>{share}/{symTotal}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ffd84e", textAlign: "right" }}>%{(prob * 100).toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary pill */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill label="Jackpot" value={`%${(probabilities.jackpot * 100).toFixed(2)}`} color="#ffd84e" />
        {probabilities.symbols.map(({ id, prob }) => (
          <Pill key={id} label={id} value={`%${(prob * 100).toFixed(2)}`} color="rgba(255,255,255,0.5)" />
        ))}
        <Pill label="Kazanmaz" value={`%${(probabilities.lose * 100).toFixed(1)}`} color="#ff7e5a" />
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Önizleme" />
    </div>
  );
}

/* ─── Step 4: Preview & Save ─────────────────────────────────── */
function StepPreview({
  st, probabilities, saving, saved, saveError, onSave, onBack,
}: {
  st: State;
  probabilities: ReturnType<typeof computeProbs>;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  onSave: () => void;
  onBack: () => void;
}) {
  const variantInfo = VARIANTS.find((v) => v.id === st.variant)!;
  const selectedPlanLabel = `${planLabel(st.plan)} · ${billingLabel(st.billingCycle)}`;
  const selectedPlanPrice = planPrice(st.plan, st.billingCycle);
  const checkoutPlan = checkoutPlanFromStudio(st.plan);
  const checkoutPeriod = checkoutPeriodFromStudio(st.billingCycle);
  const checkoutHref = `/dashboard/billing/${st.slug}?checkout=1&plan=${checkoutPlan}&period=${checkoutPeriod}`;

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <StepHeader title="Önizleme & Kaydet" sub="Konfigürasyonunu gözden geçir. Kaydettikten sonra seçilen paketin ödeme ekranına yönleneceksin." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: summary */}
        <div style={{ display: "grid", gap: 16 }}>
          <SummaryCard title="İşletme">
            <Row label="Adı" val={st.name} />
            <Row label="Müşteri linki" val={`/play/${st.slug}`} accent />
            <Row
              label="Abonelik"
              val={selectedPlanLabel}
            />
            <Row label="Ücret" val={selectedPlanPrice} accent />
            <Row label="Müşteri dili" val={st.interfaceLanguage === "en" ? "English" : "Türkçe"} />
            <Row label="Para birimi" val={`${CURRENCY_META[st.currency].symbol} ${st.currency}`} />
            <Row label="Jeton eşiği" val={`Her ${st.tokenThreshold} ${CURRENCY_META[st.currency].symbol} = 1 jeton`} />
            <Row label="Zaman dilimi" val={(TIMEZONES.find(t => t.tz === st.timezone)?.label ?? st.timezone)} />
            <Row label="Fiş modu" val={st.receiptMode === "ocr" ? "Standart (Foto+AI)" : st.receiptMode === "qr" ? "QR" : "Otomatik"} />
            <Row label="Slot tasarımı" val={variantInfo.label} />
          </SummaryCard>

          <SummaryCard title="Kazanma Oranları">
            <Row label="Genel kazanma" val={`%${st.winRate}`} />
            <Row label="Jackpot ihtimali" val={`%${(probabilities.jackpot * 100).toFixed(2)}`} accent />
            {probabilities.symbols.map(({ id, prob }) => (
              <Row key={id} label={id.charAt(0).toUpperCase() + id.slice(1)} val={`%${(prob * 100).toFixed(2)}`} />
            ))}
            <Row label="Kazanmaz" val={`%${(probabilities.lose * 100).toFixed(1)}`} dim />
          </SummaryCard>
        </div>

        {/* Right: reward list */}
        <SummaryCard title="Sembol & Ödüller">
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 32, height: 32 }}>{SYMBOL_REGISTRY.seven.render({ size: 32, tone: "warm" })}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ffd84e" }}>7 · Jackpot</div>
                <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)" }}>{st.jackpotReward}</div>
                <div style={{ fontSize: 10, color: "rgba(244,239,230,0.35)", fontFamily: "monospace" }}>{st.jackpotCoupon}</div>
              </div>
            </div>
            {st.selected.map((id) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 32, height: 32 }}>{SYMBOL_REGISTRY[id].render({ size: 32, tone: "warm" })}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.85)" }}>{id.charAt(0).toUpperCase() + id.slice(1)}</div>
                  <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)" }}>{st.symCfg[id]?.reward}</div>
                  <div style={{ fontSize: 10, color: "rgba(244,239,230,0.35)", fontFamily: "monospace" }}>{st.symCfg[id]?.coupon}</div>
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>

      {saved && (
        <div style={{ padding: 20, borderRadius: 16, background: "rgba(142,242,161,0.08)", border: "1px solid rgba(142,242,161,0.22)", color: "#8ef2a1" }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>✓ Konfigürasyon kaydedildi</div>
          <div style={{ marginTop: 6, color: "rgba(210,255,218,0.78)", fontSize: 13, lineHeight: 1.45 }}>
            Seçilen paket: <strong>{selectedPlanLabel} · {selectedPlanPrice}</strong>. Ödeme sayfasına yönlendirme hazır.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <a href="/dashboard" style={successActionPrimary}>Dashboard&apos;a Git</a>
            <a href={checkoutHref} style={successActionSecondary}>Ödemeye Git</a>
            <a href={`/play/${st.slug}`} target="_blank" rel="noreferrer" style={successActionSecondary}>Müşteri Sayfası</a>
          </div>
        </div>
      )}

      {saveError && (
        <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,126,90,0.1)", border: "1px solid rgba(255,126,90,0.28)", color: "#ffb199", fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: "#ffdfd2" }}>Ödeme başlatılamadı.</strong>
          <div style={{ marginTop: 6 }}>{saveError}</div>
          <div style={{ marginTop: 10, color: "rgba(255,223,210,0.72)" }}>
            İşletme ödeme tamamlanana kadar aktif görünmez. Plan sayfasından tekrar ödeme başlatabilirsin.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onBack} style={secondaryBtn} type="button">{saved ? "← Düzenlemeye Devam Et" : "← Geri"}</button>
        {saved ? (
          <a href={checkoutHref} style={{ ...primaryBtn, flex: 1, textAlign: "center", textDecoration: "none" }}>
            Ödemeye Git
          </a>
        ) : (
          <button
            onClick={onSave}
            disabled={saving}
            style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, flex: 1 }}
            type="button"
          >
            {saving ? "Kaydediliyor…" : "Kaydet ve Ödemeye Geç"}
          </button>
        )}
      </div>
      <div style={{ marginTop: -20, color: "rgba(244,239,230,0.38)", fontSize: 12, lineHeight: 1.5 }}>
        İşletme kaydedildikten sonra seçilen paketle ödeme sayfasına yönlendirilirsin.
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#f4efe6" }}>{title}</h2>
      <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "rgba(244,239,230,0.5)", lineHeight: 1.55 }}>{sub}</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,239,230,0.5)" }}>{label}</label>
      {children}
      {hint && <p style={{ margin: 0, fontSize: 11.5, color: "rgba(244,239,230,0.35)", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(244,239,230,0.4)", marginBottom: 10 }}>{children}</div>
  );
}

function RewardRow({
  icon, label, isJackpot = false, reward, coupon, onReward, onCoupon,
}: {
  icon: React.ReactNode;
  label: string;
  isJackpot?: boolean;
  reward: string;
  coupon: string;
  onReward: (v: string) => void;
  onCoupon: (v: string) => void;
}) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "56px 1fr 1fr", gap: 10, alignItems: "center",
      padding: 12, borderRadius: 12,
      background: isJackpot ? "rgba(255,216,78,0.06)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isJackpot ? "rgba(255,216,78,0.2)" : "rgba(255,255,255,0.06)"}`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, color: isJackpot ? "#ffd84e" : "rgba(244,239,230,0.4)", textTransform: "uppercase" }}>{label}</span>
      </div>
      <input
        value={reward}
        onChange={(e) => onReward(e.target.value)}
        placeholder="Kazanç mesajı"
        style={inputStyle}
      />
      <input
        value={coupon}
        onChange={(e) => onCoupon(e.target.value)}
        placeholder="Kupon kodu"
        style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.05em" }}
      />
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ color: "rgba(244,239,230,0.4)" }}>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(244,239,230,0.4)", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
    </div>
  );
}

function Row({ label, val, accent, dim }: { label: string; val: string; accent?: boolean; dim?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
      <span style={{ color: "rgba(244,239,230,0.5)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent ? "#ffd84e" : dim ? "rgba(244,239,230,0.35)" : "#f4efe6" }}>{val}</span>
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel, nextDisabled }: { onBack?: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
      {onBack && <button onClick={onBack} style={secondaryBtn} type="button">← Geri</button>}
      <button onClick={onNext} disabled={nextDisabled} style={{ ...primaryBtn, opacity: nextDisabled ? 0.4 : 1 }} type="button">
        {nextLabel} →
      </button>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "#f4efe6",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  padding: "12px 28px",
  borderRadius: 12,
  background: "#ffd84e",
  border: "none",
  color: "#111",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.01em",
};

const secondaryBtn: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(244,239,230,0.7)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const successActionPrimary: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 10,
  background: "#8ef2a1",
  color: "#08110b",
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
};

const successActionSecondary: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(142,242,161,0.22)",
  color: "#c7ffd0",
  fontSize: 12,
  fontWeight: 750,
  textDecoration: "none",
  cursor: "pointer",
};

/* ─── Helpers ────────────────────────────────────────────────── */
function autoSlug(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function symEmoji(id: SymId) {
  const map: Record<SymId, string> = { beer: "🍺", wine: "🍷", shot: "🥃", martini: "🍸", cocktail: "🍹", bar: "🪧", seven: "7️⃣" };
  return map[id] ?? "🎰";
}

function computeProbs(winRate: number, jackpotShare: number, selected: SymId[], symCfg: Partial<Record<SymId, SymCfg>>) {
  const win = winRate / 100;
  const jpProb = win * (jackpotShare / 100);
  const symWin = win - jpProb;
  const total = totalSymShare(selected, symCfg);
  return {
    jackpot: jpProb,
    lose: 1 - win,
    symbols: selected.map((id) => ({
      id,
      prob: total > 0 ? symWin * ((symCfg[id]?.share ?? 0) / total) : 0,
    })),
  };
}
