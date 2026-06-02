"use client";

import { useState, useMemo, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { SYMBOL_REGISTRY, type SymId } from "../../components/slot/Symbols";
import type { SlotVariant } from "../../components/SlotMachine";
import { getClientCopy } from "../../lib/i18n/client";
import { getWheelSegmentDefs, defaultWheelSegmentCfg, segLabel, segDefaultPrize, type WheelSegmentDef } from "../../components/wheel/segments";

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

/* ─── Types ──────────────────────────────────────────────────── */
type StudioCopy = ReturnType<typeof getClientCopy>["studio"];
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

type GameType = "slot" | "wheel";
type WheelVariant = "boho" | "irish" | "medit" | "paris" | "chalk";

type State = {
  step: number;
  gameType: GameType;
  variant: SlotVariant;
  wheelVariant: WheelVariant;
  wheelSegmentCfg: Record<string, { reward: string; coupon: string; share: number }>;
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
  couponValidityDays: number;
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

function planLabel(plan: State["plan"], copy: StudioCopy) {
  return plan === "kampanya" ? copy.campaign : copy.business;
}

function billingLabel(cycle: State["billingCycle"], copy: StudioCopy) {
  return cycle === "yearly" ? copy.annual : copy.monthly;
}

function planPrice(plan: State["plan"], cycle: State["billingCycle"], copy?: StudioCopy) {
  const monthSuffix = copy?.monthSuffix ?? "/ay";
  const yearSuffix = copy?.yearSuffix ?? "/yıl";
  if (plan === "kampanya") return cycle === "yearly" ? `$20${yearSuffix}` : `$5${monthSuffix}`;
  return cycle === "yearly" ? `$50${yearSuffix}` : `$10${monthSuffix}`;
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
  const copyText = getClientCopy();
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0b0d", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(244,239,230,0.5)", fontFamily: "Inter, sans-serif" }}>{copyText.common.loading}</div>}>
      <StudioInner />
    </Suspense>
  );
}

function StudioInner() {
  const copyText = getClientCopy();
  const studioCopy = copyText.studio;
  const studioLocale: "tr" | "en" = copyText.meta.lang === "en" ? "en" : "tr";
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("slug");

  const [st, setSt] = useState<State>({
    step: 0,
    gameType: "slot",
    variant: "v1",
    wheelVariant: "boho",
    wheelSegmentCfg: defaultWheelSegmentCfg("boho"),
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
    couponValidityDays: 30,
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
          setLoadError(data.error ?? studioCopy.loadError);
          return;
        }
        const v = data.venue as State extends infer T ? Partial<Record<keyof T, unknown>> : never;
        const cfg = data.config;
        const camps = (data.campaigns ?? []) as Array<{
          symbolId: string; rewardLabel: string; couponPrefix: string; share: number; active: boolean;
        }>;

        const loadedGameType = ((v as { game_type?: string }).game_type as GameType) ?? "slot";
        const loadedWheelVariant = ((v as { wheel_variant?: string }).wheel_variant as WheelVariant) ?? "boho";

        // ── Slot symbols ──
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

        // ── Wheel segments ── campaigns hold prize segments; jackpot segment
        //    reward comes from symbol_configs (jackpot_reward / coupon_prefix).
        const newWheelCfg = defaultWheelSegmentCfg(loadedWheelVariant);
        if (loadedGameType === "wheel") {
          for (const c of camps) {
            if (newWheelCfg[c.symbolId]) {
              newWheelCfg[c.symbolId] = {
                reward: c.rewardLabel,
                coupon: c.couponPrefix,
                share: Math.round((c.share ?? 0.2) * 100),
              };
            }
          }
          const jpSeg = getWheelSegmentDefs(loadedWheelVariant).find((d) => d.type === "jackpot");
          if (jpSeg && cfg) {
            newWheelCfg[jpSeg.id] = {
              reward: cfg.jackpotReward ?? newWheelCfg[jpSeg.id].reward,
              coupon: cfg.jackpotCoupon ?? newWheelCfg[jpSeg.id].coupon,
              share: newWheelCfg[jpSeg.id].share,
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
          couponValidityDays: (v as { couponValidityDays?: number }).couponValidityDays ?? prev.couponValidityDays,
          gameType:       loadedGameType,
          wheelVariant:   loadedWheelVariant,
          wheelSegmentCfg: newWheelCfg,
          variant:        cfg?.variant ?? prev.variant,
          winRate:        cfg ? Math.round(cfg.winRate * 100) : prev.winRate,
          jackpotShare:   cfg ? Math.round(cfg.jackpotShare * 100) : prev.jackpotShare,
          jackpotReward:  cfg?.jackpotReward ?? prev.jackpotReward,
          jackpotCoupon:  cfg?.jackpotCoupon ?? prev.jackpotCoupon,
          selected:       newSelected.length ? newSelected : prev.selected,
          symCfg:         newSelected.length ? newCfg : prev.symCfg,
        }));
      } catch {
        if (!cancelled) setLoadError(studioCopy.connectionError);
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

    if (st.gameType === "wheel") {
      const prizeSegs = getWheelSegmentDefs(st.wheelVariant).filter((d) => d.type === "prize");
      const total = prizeSegs.reduce((s, seg) => s + (st.wheelSegmentCfg[seg.id]?.share ?? 0), 0);
      return {
        jackpot: jpProb,
        lose: 1 - win,
        symbols: prizeSegs.map((seg) => ({
          id: seg.id,
          prob: total > 0 ? symWin * ((st.wheelSegmentCfg[seg.id]?.share ?? 0) / total) : 0,
        })),
      };
    }

    const total = totalSymShare(st.selected, st.symCfg);
    return {
      jackpot: jpProb,
      lose: 1 - win,
      symbols: st.selected.map((id) => ({
        id,
        prob: total > 0 ? symWin * ((st.symCfg[id]?.share ?? 0) / total) : 0,
      })),
    };
  }, [st.winRate, st.jackpotShare, st.selected, st.symCfg, st.gameType, st.wheelVariant, st.wheelSegmentCfg]);

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
          name: st.symCfg[id as SymId]?.reward ?? id,
          probability: prob,
          couponCodePrefix: st.symCfg[id as SymId]?.coupon ?? id.toUpperCase(),
        })),
        {
          name: "No Reward",
          probability: probabilities.lose,
          couponCodePrefix: "LOSE",
        },
      ];

      // Always sync to localStorage so main page picks it up instantly
      const localPayload = {
        name: st.name || studioCopy.business,
        logoSymbol: st.name.slice(0, 2).toUpperCase() || "??",
        slotVariant: st.variant,
        tokenThreshold: st.tokenThreshold,
        plan: st.plan,
        billingCycle: st.billingCycle,
        interfaceLanguage: st.interfaceLanguage,
        planPrice: planPrice(st.plan, st.billingCycle, studioCopy),
        rewards: probabilities.symbols.map(({ id }) => ({
          icon: symEmoji(id as SymId),
          label: st.symCfg[id as SymId]?.reward ?? id,
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
      //
      // Wheel mode mirrors the slot model exactly:
      //   · jackpot segment  → symbol_configs.jackpot_reward / jackpot_coupon_prefix
      //   · prize segments   → campaigns (the win pool, each with its own share)
      //   · lose segments    → not persisted (no campaign = lose outcome)
      const wheelDefs = st.gameType === "wheel" ? getWheelSegmentDefs(st.wheelVariant) : [];
      const wheelJackpotSeg = wheelDefs.find((d) => d.type === "jackpot");

      const sbPayload = {
        slug: st.slug,
        name: st.name || studioCopy.business,
        plan: st.plan,
        billingCycle: st.billingCycle,
        currency: st.currency,
        receiptMode: st.receiptMode,
        interfaceLanguage: st.interfaceLanguage,
        timezone: st.timezone,
        tokenThreshold: st.tokenThreshold,
        couponValidityDays: st.couponValidityDays,
        gameType: st.gameType,
        wheelVariant: st.wheelVariant,
        variant: st.variant,
        winRate: st.winRate / 100,
        jackpotShare: st.jackpotShare / 100,
        jackpotReward: st.gameType === "wheel" && wheelJackpotSeg
          ? (st.wheelSegmentCfg[wheelJackpotSeg.id]?.reward ?? wheelJackpotSeg.defaultPrize ?? "")
          : st.jackpotReward,
        jackpotCoupon: st.gameType === "wheel" && wheelJackpotSeg
          ? (st.wheelSegmentCfg[wheelJackpotSeg.id]?.coupon ?? wheelJackpotSeg.defaultCoupon)
          : st.jackpotCoupon,
        campaigns: st.gameType === "wheel"
          ? wheelDefs
              .filter((seg) => seg.type === "prize")
              .map((seg) => ({
                symbolId: seg.id,
                rewardLabel: st.wheelSegmentCfg[seg.id]?.reward ?? seg.defaultPrize ?? "",
                couponPrefix: st.wheelSegmentCfg[seg.id]?.coupon ?? seg.defaultCoupon,
                share: (st.wheelSegmentCfg[seg.id]?.share ?? 20) / 100,
              }))
          : st.selected.map((id) => ({
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
        const err = await sbRes.json().catch(() => ({ error: studioCopy.saveError }));
        console.error("Supabase save failed:", err);
        setSaveError(err.error ?? studioCopy.saveErrorRetry);
        return;
      } else {
        const savedVenue = await sbRes.json().catch(() => null) as {
          venueId?: string;
          slug?: string;
          wasActive?: boolean;
          planChanged?: boolean;
        } | null;
        checkoutSlug = savedVenue?.slug ?? st.slug;

        // ── Already-paying venue: don't open a new checkout. ──
        //    · Plan unchanged → just go to dashboard.
        //    · Plan changed   → update the existing Paddle subscription
        //                       (proration applied immediately).
        if (savedVenue?.wasActive && checkoutSlug) {
          if (savedVenue.planChanged) {
            const upRes = await fetch("/api/paddle/update-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: checkoutSlug, plan: st.plan, billingCycle: st.billingCycle }),
            });
            if (!upRes.ok) {
              // Fallback: open Paddle checkout if the update couldn't be applied
              const errBody = await upRes.json().catch(() => ({}));
              if (errBody?.code !== "no_subscription") {
                setSaveError(errBody?.error ?? studioCopy.saveErrorRetry);
                return;
              }
              if (savedVenue?.venueId) {
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
          }
          // Update applied (or nothing to update) → straight to dashboard
          window.location.href = `/dashboard`;
          return;
        }

        // ── Brand-new / unpaid venue: open a fresh checkout. ──
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
            name: st.name || studioCopy.business,
            logoSymbol: st.name.slice(0, 2).toUpperCase() || "??",
            headline: "Gecenin Ritmi",
            subheadline: "Modern gastronomi deneyimi",
            background: "#111111",
            surface: "#1c1b1d",
            ink: "#f6f1e3",
            accent: "#ffd84e",
            accentSoft: "#ffd84e",
            rewards: probabilities.symbols.map(({ id }) => ({
              icon: symEmoji(id as SymId),
              label: st.symCfg[id as SymId]?.reward ?? id,
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
        studioCopy.checkoutOpenError
      );
    } finally {
      update({ saving: false });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0d", color: "#f4efe6", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: "#ffd84e" }}>SnapJack</div>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontSize: 13, color: "rgba(244,239,230,0.5)", fontWeight: 500 }}>
          {editSlug ? `${studioCopy.editing} · ${editSlug}` : studioCopy.setupPanel}
        </div>
        {loading && (
          <div style={{ marginLeft: "auto", fontSize: 11, color: "rgba(244,239,230,0.4)" }}>{studioCopy.loadingConfig}</div>
        )}
        {loadError && (
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#ff7e5a" }}>{loadError}</div>
        )}
      </header>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Step bar */}
        {(() => {
          const stepLabels = st.gameType === "wheel"
            ? copyText.studio.wheelSteps
            : studioCopy.steps;
          return <StepBar current={st.step} labels={stepLabels} onGo={goTo} />;
        })()}

        <div style={{ marginTop: 40 }}>
          {st.step === 0 && <StepVariant st={st} update={update} onNext={() => goTo(1)} copy={studioCopy} locale={studioLocale} />}
          {st.step === 1 && <StepInfo st={st} update={update} onNext={() => goTo(2)} onBack={() => goTo(0)} copy={studioCopy} />}
          {st.step === 2 && <StepSymbols st={st} update={update} onNext={() => goTo(3)} onBack={() => goTo(1)} copy={studioCopy} locale={studioLocale} />}
          {st.step === 3 && <StepRates st={st} update={update} probabilities={probabilities} onNext={() => goTo(4)} onBack={() => goTo(2)} copy={studioCopy} locale={studioLocale} />}
          {st.step === 4 && <StepPreview st={st} probabilities={probabilities} saving={st.saving} saved={st.saved} saveError={saveError} onSave={handleSave} onBack={() => goTo(3)} copy={studioCopy} locale={studioLocale} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Step Bar ───────────────────────────────────────────────── */
function StepBar({ current, labels, onGo }: { current: number; labels: readonly string[]; onGo: (i: number) => void }) {
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
const WHEEL_VARIANTS: { id: WheelVariant; bg: string; accent: string; preview: string }[] = [
  {
    id: "boho",
    bg: "linear-gradient(135deg, #f5efe0 0%, #e8d8c0 100%)",
    accent: "#c17f5a",
    preview: "🌿",
  },
  {
    id: "irish",
    bg: "linear-gradient(135deg, #0d1a0e 0%, #1a2e1c 100%)",
    accent: "#c8922a",
    preview: "☘",
  },
  {
    id: "medit",
    bg: "linear-gradient(135deg, #f0f4f8 0%, #dde6ea 100%)",
    accent: "#1a6b8a",
    preview: "☀",
  },
  {
    id: "paris",
    bg: "linear-gradient(135deg, #f5ebd6 0%, #ede0c4 100%)",
    accent: "#7a1f2b",
    preview: "🥐",
  },
  {
    id: "chalk",
    bg: "linear-gradient(135deg, #fbeef0 0%, #f4b9c5 100%)",
    accent: "#b03a5b",
    preview: "🍰",
  },
];

function StepVariant({ st, update, onNext, copy, locale }: { st: State; update: (p: Partial<State>) => void; onNext: () => void; copy: StudioCopy; locale: "tr" | "en" }) {
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <StepHeader title={copy.gameEngineTitle} sub={copy.gameEngineHelp} />

      {/* Game type toggle */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,239,230,0.5)", marginBottom: 10 }}>{copy.gameType}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {([
            { id: "slot" as GameType, label: `🎰 ${copy.gameTypes.slot.label}`, desc: copy.gameTypes.slot.desc },
            { id: "wheel" as GameType, label: `🎡 ${copy.gameTypes.wheel.label}`, desc: copy.gameTypes.wheel.desc },
          ]).map((g) => {
            const active = st.gameType === g.id;
            return (
              <button
                key={g.id}
                onClick={() => update({ gameType: g.id as GameType, ...(g.id === 'wheel' ? { wheelSegmentCfg: defaultWheelSegmentCfg(st.wheelVariant, locale) } : {}) })}
                type="button"
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: 14, textAlign: "left", cursor: "pointer",
                  background: active ? "rgba(255,216,78,0.08)" : "rgba(255,255,255,0.03)",
                  border: `2px solid ${active ? "#ffd84e" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: active ? "0 0 0 1px rgba(255,216,78,0.2)" : "none",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: active ? "#ffd84e" : "#f4efe6" }}>{g.label}</div>
                <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", marginTop: 4 }}>{g.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot variants */}
      {st.gameType === "slot" && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,239,230,0.5)", marginBottom: 10 }}>{copy.slotTheme}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {VARIANTS.map((v) => {
              const active = st.variant === v.id;
              const variantCopy = copy.variants[v.id];
              return (
                <button
                  key={v.id}
                  onClick={() => update({ variant: v.id })}
                  style={{
                    background: "none", border: `2px solid ${active ? "#ffd84e" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 16, padding: 0, cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s", overflow: "hidden",
                    boxShadow: active ? "0 0 0 1px rgba(255,216,78,0.3), 0 0 24px rgba(255,216,78,0.08)" : "none",
                  }}
                  type="button"
                >
                  <div style={{ height: 120, background: v.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 32 }}>{v.preview}</div>
                    <div style={{ padding: "3px 12px", borderRadius: 999, border: `1px solid ${v.accent}44`, background: `${v.accent}22`, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: v.accent }}>{variantCopy.label}</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#f4efe6" }}>{variantCopy.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)", marginTop: 3, lineHeight: 1.4 }}>{variantCopy.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Wheel variants */}
      {st.gameType === "wheel" && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,239,230,0.5)", marginBottom: 10 }}>{copy.wheelTheme}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {WHEEL_VARIANTS.map((v) => {
              const active = st.wheelVariant === v.id;
              const variantCopy = copy.wheelVariants[v.id];
              return (
                <button
                  key={v.id}
                  onClick={() => update({ wheelVariant: v.id, wheelSegmentCfg: defaultWheelSegmentCfg(v.id, locale) })}
                  style={{
                    background: "none", border: `2px solid ${active ? v.accent : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 16, padding: 0, cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s", overflow: "hidden",
                    boxShadow: active ? `0 0 0 1px ${v.accent}50, 0 0 24px ${v.accent}20` : "none",
                  }}
                  type="button"
                >
                  <div style={{ height: 120, background: v.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 32 }}>{v.preview}</div>
                    <div style={{ padding: "3px 12px", borderRadius: 999, border: `1px solid ${v.accent}44`, background: `${v.accent}22`, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: v.accent }}>{variantCopy.label}</div>
                  </div>
                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#f4efe6" }}>{variantCopy.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)", marginTop: 3, lineHeight: 1.4 }}>{variantCopy.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <NavRow onNext={onNext} nextLabel={copy.continue} />
    </div>
  );
}

/* ─── Step 1: Info ───────────────────────────────────────────── */
function StepInfo({ st, update, onNext, onBack, copy }: { st: State; update: (p: Partial<State>) => void; onNext: () => void; onBack: () => void; copy: StudioCopy }) {
  const meta = CURRENCY_META[st.currency];
  const exampleAmount = st.currency === "TRY" ? 225 : st.currency === "USD" ? 15 : 12;
  const exampleTokens = Math.floor(exampleAmount / st.tokenThreshold);
  const planPrices: Record<State["plan"], Record<State["billingCycle"], string>> = {
    kampanya: { monthly: planPrice("kampanya", "monthly", copy), yearly: planPrice("kampanya", "yearly", copy) },
    isletme: { monthly: planPrice("isletme", "monthly", copy), yearly: planPrice("isletme", "yearly", copy) },
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
      <StepHeader title={copy.businessInfo} sub={copy.businessInfoHelp} />
      <div style={{ display: "grid", gap: 20 }}>
        <Field label={copy.businessName} hint={copy.businessNameHint}>
          <input
            value={st.name}
            onChange={(e) => update({ name: e.target.value, slug: st.slug || autoSlug(e.target.value) })}
            placeholder={copy.businessNamePlaceholder}
            maxLength={24}
            style={inputStyle}
          />
        </Field>
        <Field label={copy.urlSlug} hint={`${copy.customerLink}: /play/${st.slug || "midnight-tap"}`}>
          <input
            value={st.slug}
            onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            placeholder="midnight-tap"
            maxLength={48}
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
          />
        </Field>
        <Field label={copy.customerInterfaceLanguage} hint={copy.customerInterfaceLanguageHelp}>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { id: "tr", label: copy.languageTurkish, sub: "TR" },
              { id: "en", label: copy.languageEnglish, sub: "EN" },
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
          label={copy.subscriptionType}
          hint={`${copy.selectedPackage}: ${planLabel(st.plan, copy)} · ${planPrices[st.plan][st.billingCycle]}`}
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
                  {billingLabel(cycle, copy)}
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
                  {planLabel(p, copy)} · {planPrices[p][st.billingCycle]}
                </button>
              ))}
            </div>
          </div>
        </Field>
        {/* Currency selector */}
        <Field label={copy.currency} hint={copy.currencyHelp}>
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
          label={copy.tokenThreshold}
          hint={copy.tokenThresholdHint
            .replace("{threshold}", String(st.tokenThreshold))
            .replace("{symbol}", meta.symbol)
            .replace("{amount}", String(exampleAmount))
            .replace("{tokens}", String(exampleTokens))}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{copy.every}</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={st.tokenThreshold}
              onChange={(e) => update({ tokenThreshold: Math.max(1, Number(e.target.value)) })}
              style={{ ...inputStyle, width: 110 }}
            />
            <span style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{meta.symbol} {copy.oneToken}</span>
          </div>
        </Field>

        {/* Timezone */}
        <Field label={copy.timezone} hint={copy.timezoneHelp}>
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
          label={copy.receiptMode}
          hint={
            st.receiptMode === "ocr"   ? copy.receiptModeHints.ocr
          : st.receiptMode === "qr"    ? copy.receiptModeHints.qr
          : copy.receiptModeHints.both
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {([
              { id: "ocr",  label: copy.receiptModes.ocr.label,  sub: copy.receiptModes.ocr.sub },
              { id: "qr",   label: copy.receiptModes.qr.label,   sub: copy.receiptModes.qr.sub },
              { id: "both", label: copy.receiptModes.both.label, sub: copy.receiptModes.both.sub },
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
      <NavRow onBack={onBack} onNext={onNext} nextLabel={copy.continue} backLabel={copy.back} nextDisabled={!st.name.trim() || !st.slug.trim()} />
    </div>
  );
}

/* ─── Step 2: Symbols & Rewards ──────────────────────────────── */
function StepSymbols({ st, update, onNext, onBack, copy, locale }: { st: State; update: (p: Partial<State>) => void; onNext: () => void; onBack: () => void; copy: StudioCopy; locale: "tr" | "en" }) {
  // For wheel mode: show segment reward editor
  if (st.gameType === "wheel") {
    const defs = getWheelSegmentDefs(st.wheelVariant);
    const prizeDefs = defs.filter((d: WheelSegmentDef) => d.type !== 'lose');
    const loseDefs = defs.filter((d: WheelSegmentDef) => d.type === 'lose');

    function setWheelCfg(id: string, patch: Partial<{ reward: string; coupon: string; share: number }>) {
      update({
        wheelSegmentCfg: {
          ...st.wheelSegmentCfg,
          [id]: { ...(st.wheelSegmentCfg[id] ?? { reward: '', coupon: '', share: 20 }), ...patch },
        },
      });
    }

    const canNextWheel = prizeDefs.filter((d: WheelSegmentDef) => d.type !== 'jackpot').every((d: WheelSegmentDef) =>
      st.wheelSegmentCfg[d.id]?.reward?.trim() && st.wheelSegmentCfg[d.id]?.coupon?.trim()
    );

    return (
      <div style={{ display: "grid", gap: 32 }}>
        <StepHeader
          title={copy.wheelRewardsTitle}
          sub={copy.wheelRewardsHelp}
        />

        <CampaignInfoBox copy={copy} />

        {/* Prize + Jackpot segments */}
        <div>
          <SectionLabel>{copy.wheelPrizeSegments}</SectionLabel>
          <div style={{ display: "grid", gap: 10 }}>
            {prizeDefs.map((seg: WheelSegmentDef) => (
              <div key={seg.id} style={{
                display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: 10, alignItems: "center",
                padding: 12, borderRadius: 12,
                background: seg.type === 'jackpot' ? "rgba(255,216,78,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${seg.type === 'jackpot' ? "rgba(255,216,78,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: seg.color, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}>{seg.icon}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: seg.type === 'jackpot' ? "#ffd84e" : "rgba(244,239,230,0.4)", textTransform: "uppercase" }}>{segLabel(seg, locale)}</span>
                </div>
                <input
                  value={st.wheelSegmentCfg[seg.id]?.reward ?? ''}
                  onChange={(e) => setWheelCfg(seg.id, { reward: e.target.value })}
                  placeholder={copy.rewardPlaceholder}
                  style={inputStyle}
                />
                <input
                  value={st.wheelSegmentCfg[seg.id]?.coupon ?? ''}
                  onChange={(e) => setWheelCfg(seg.id, { coupon: e.target.value.toUpperCase() })}
                  placeholder={copy.couponPlaceholder}
                  style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.05em" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Lose segments — read-only */}
        <div>
          <SectionLabel>{copy.wheelLoseSegments.replace("{count}", String(loseDefs.length))}</SectionLabel>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {loseDefs.map((seg: WheelSegmentDef) => (
              <div key={seg.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                borderRadius: 10, background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)", opacity: 0.6,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: seg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{seg.icon}</div>
                <span style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", fontWeight: 600 }}>{segLabel(seg, locale)}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(244,239,230,0.3)", lineHeight: 1.5 }}>
            {copy.wheelLoseHelp}
          </p>
        </div>

        <NavRow onBack={onBack} onNext={onNextWheel} nextLabel={copy.continue} backLabel={copy.back} nextDisabled={!canNextWheel} />
      </div>
    );

    function onNextWheel() { onNext(); }
  }

  // ---- Original slot mode below ----
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
        title={copy.symbolsTitle}
        sub={copy.symbolsHelp.replace("{max}", String(MAX_SYMBOLS))}
      />

      <CampaignInfoBox copy={copy} />

      {/* Symbol pool */}
      <div>
        <SectionLabel>{copy.symbolPool} ({copy.selectedCount.replace("{selected}", String(st.selected.length)).replace("{max}", String(MAX_SYMBOLS))})</SectionLabel>
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
          <SectionLabel>{copy.rewardConfig}</SectionLabel>
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
              rewardPlaceholder={copy.rewardPlaceholder}
              couponPlaceholder={copy.couponPlaceholder}
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
                rewardPlaceholder={copy.rewardPlaceholder}
                couponPlaceholder={copy.couponPlaceholder}
              />
            ))}
          </div>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextLabel={copy.continue} backLabel={copy.back} nextDisabled={!canNext} />
    </div>
  );
}

/* ─── Step 3: Rates ──────────────────────────────────────────── */
function StepRates({
  st, update, probabilities, onNext, onBack, copy, locale,
}: {
  st: State;
  update: (p: Partial<State>) => void;
  probabilities: ReturnType<typeof computeProbs>;
  onNext: () => void;
  onBack: () => void;
  copy: StudioCopy;
  locale: "tr" | "en";
}) {
  const isWheel = st.gameType === "wheel";

  function setSymShare(id: SymId, val: number) {
    update({
      symCfg: {
        ...st.symCfg,
        [id]: { ...(st.symCfg[id] ?? { reward: "", coupon: "", share: 20 }), share: Math.max(1, val) },
      },
    });
  }
  function setWheelShare(id: string, val: number) {
    update({
      wheelSegmentCfg: {
        ...st.wheelSegmentCfg,
        [id]: { ...(st.wheelSegmentCfg[id] ?? { reward: "", coupon: "", share: 20 }), share: Math.max(1, val) },
      },
    });
  }

  // Normalized distribution rows — slot symbols OR wheel prize segments.
  type DistRow = { id: string; label: string; icon: ReactNode; share: number; setShare: (v: number) => void };
  const distRows: DistRow[] = isWheel
    ? getWheelSegmentDefs(st.wheelVariant)
        .filter((seg) => seg.type === "prize")
        .map((seg) => ({
          id: seg.id,
          label: segLabel(seg, locale),
          icon: (
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: seg.color,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>{seg.icon}</div>
          ),
          share: st.wheelSegmentCfg[seg.id]?.share ?? 20,
          setShare: (v: number) => setWheelShare(seg.id, v),
        }))
    : st.selected.map((id) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        icon: <div style={{ width: 24, height: 24 }}>{SYMBOL_REGISTRY[id].render({ size: 24, tone: "warm" })}</div>,
        share: st.symCfg[id]?.share ?? 20,
        setShare: (v: number) => setSymShare(id, v),
      }));

  const distTotal = distRows.reduce((s, r) => s + r.share, 0);
  const labelFor = (id: string) => distRows.find((r) => r.id === id)?.label ?? id;

  return (
    <div style={{ display: "grid", gap: 32, maxWidth: 600 }}>
      <StepHeader
        title={copy.ratesTitle}
        sub={copy.ratesHelp}
      />

      <div style={{ display: "grid", gap: 24 }}>
        {/* Overall win rate */}
        <Field label={`${copy.overallWinRate} — %${st.winRate}`} hint={copy.overallWinHint}>
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
        <Field
          label={`${copy.jackpotShare} — ${copy.jackpotShareLabel.replace("{share}", String(st.jackpotShare))}`}
          hint={copy.jackpotShareHint.replace("{percent}", ((st.winRate * st.jackpotShare) / 100).toFixed(1))}
        >
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

        {/* Coupon validity (lifetime of won coupons) */}
        <Field
          label={copy.couponValidity}
          hint={st.couponValidityDays > 0
            ? copy.couponValidityHint.replace("{days}", String(st.couponValidityDays))
            : copy.couponValidityNever}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {[7, 14, 30, 60, 90, 0].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update({ couponValidityDays: d })}
                style={{
                  padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${st.couponValidityDays === d ? "#ffd84e" : "rgba(255,255,255,0.12)"}`,
                  background: st.couponValidityDays === d ? "rgba(255,216,78,0.12)" : "transparent",
                  color: st.couponValidityDays === d ? "#ffd84e" : "rgba(244,239,230,0.7)",
                }}
              >
                {d === 0 ? copy.couponValidityNeverShort : copy.couponValidityDayLabel.replace("{days}", String(d))}
              </button>
            ))}
          </div>
        </Field>

        {/* Per-symbol / per-segment share */}
        <div>
          <SectionLabel>{copy.symbolDistribution}</SectionLabel>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(244,239,230,0.45)", lineHeight: 1.5 }}>
            {copy.symbolDistributionHelp}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {distRows.map((row) => {
              const prob = probabilities.symbols.find((s) => s.id === row.id)?.prob ?? 0;
              return (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px 80px", gap: 10, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.7)" }}>
                    {row.icon}
                    {row.label}
                  </div>
                  <input
                    type="range" min={1} max={100}
                    value={row.share}
                    onChange={(e) => row.setShare(Number(e.target.value))}
                    style={{ accentColor: "#ffd84e" }}
                  />
                  <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", textAlign: "right" }}>{row.share}/{distTotal}</div>
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
          <Pill key={id} label={labelFor(id)} value={`%${(prob * 100).toFixed(2)}`} color="rgba(255,255,255,0.5)" />
        ))}
        <Pill label={copy.noReward} value={`%${(probabilities.lose * 100).toFixed(1)}`} color="#ff7e5a" />
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel={copy.preview} backLabel={copy.back} />
    </div>
  );
}

/* ─── Step 4: Preview & Save ─────────────────────────────────── */
function StepPreview({
  st, probabilities, saving, saved, saveError, onSave, onBack, copy, locale,
}: {
  st: State;
  probabilities: ReturnType<typeof computeProbs>;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  onSave: () => void;
  onBack: () => void;
  copy: StudioCopy;
  locale: "tr" | "en";
}) {
  const variantInfo = VARIANTS.find((v) => v.id === st.variant)!;
  const selectedPlanLabel = `${planLabel(st.plan, copy)} · ${billingLabel(st.billingCycle, copy)}`;
  const selectedPlanPrice = planPrice(st.plan, st.billingCycle, copy);
  const checkoutPlan = checkoutPlanFromStudio(st.plan);
  const checkoutPeriod = checkoutPeriodFromStudio(st.billingCycle);
  const checkoutHref = `/dashboard/billing/${st.slug}?checkout=1&plan=${checkoutPlan}&period=${checkoutPeriod}`;

  const isWheel = st.gameType === "wheel";
  const wheelDefs = isWheel ? getWheelSegmentDefs(st.wheelVariant) : [];
  const wheelJackpotSeg = wheelDefs.find((d) => d.type === "jackpot");

  // Reward rows for the right-hand summary card (jackpot + prize entries).
  type RewardRowView = { id: string; label: string; icon: ReactNode; reward: string; coupon: string; jackpot?: boolean };
  const jackpotRow: RewardRowView = isWheel && wheelJackpotSeg
    ? {
        id: wheelJackpotSeg.id,
        label: `${wheelJackpotSeg.icon} · Jackpot`,
        icon: <div style={{ width: 32, height: 32, borderRadius: "50%", background: wheelJackpotSeg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{wheelJackpotSeg.icon}</div>,
        reward: st.wheelSegmentCfg[wheelJackpotSeg.id]?.reward ?? "",
        coupon: st.wheelSegmentCfg[wheelJackpotSeg.id]?.coupon ?? "",
        jackpot: true,
      }
    : {
        id: "seven",
        label: "7 · Jackpot",
        icon: <div style={{ width: 32, height: 32 }}>{SYMBOL_REGISTRY.seven.render({ size: 32, tone: "warm" })}</div>,
        reward: st.jackpotReward,
        coupon: st.jackpotCoupon,
        jackpot: true,
      };
  const prizeRows: RewardRowView[] = isWheel
    ? wheelDefs.filter((seg) => seg.type === "prize").map((seg) => ({
        id: seg.id,
        label: segLabel(seg, locale),
        icon: <div style={{ width: 32, height: 32, borderRadius: "50%", background: seg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{seg.icon}</div>,
        reward: st.wheelSegmentCfg[seg.id]?.reward ?? "",
        coupon: st.wheelSegmentCfg[seg.id]?.coupon ?? "",
      }))
    : st.selected.map((id) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        icon: <div style={{ width: 32, height: 32 }}>{SYMBOL_REGISTRY[id].render({ size: 32, tone: "warm" })}</div>,
        reward: st.symCfg[id]?.reward ?? "",
        coupon: st.symCfg[id]?.coupon ?? "",
      }));
  const ratesLabelFor = (id: string) => {
    if (isWheel) {
      const seg = wheelDefs.find((d) => d.id === id);
      return seg ? segLabel(seg, locale) : id;
    }
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <StepHeader title={copy.previewSave} sub={copy.previewSaveHelp} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: summary */}
        <div style={{ display: "grid", gap: 16 }}>
          <SummaryCard title={copy.summaryBusiness}>
            <Row label={copy.rows.name} val={st.name} />
            <Row label={copy.customerLink} val={`/play/${st.slug}`} accent />
            <Row
              label={copy.rows.subscription}
              val={selectedPlanLabel}
            />
            <Row label={copy.rows.price} val={selectedPlanPrice} accent />
            <Row label={copy.rows.customerLanguage} val={st.interfaceLanguage === "en" ? copy.languageEnglish : copy.languageTurkish} />
            <Row label={copy.rows.currency} val={`${CURRENCY_META[st.currency].symbol} ${st.currency}`} />
            <Row label={copy.rows.tokenThreshold} val={`${copy.every} ${st.tokenThreshold} ${CURRENCY_META[st.currency].symbol} ${copy.oneToken}`} />
            <Row label={copy.rows.timezone} val={(TIMEZONES.find(t => t.tz === st.timezone)?.label ?? st.timezone)} />
            <Row label={copy.rows.receiptMode} val={copy.scanModeLabels[st.receiptMode]} />
            {st.gameType === "slot"
              ? <Row label={copy.rows.slotDesign} val={copy.variants[variantInfo.id].label} />
              : <Row label={copy.rows.wheelTheme} val={copy.wheelVariants[st.wheelVariant].label} />
            }
            <Row label={copy.rows.gameEngine} val={st.gameType === "slot" ? `🎰 ${copy.gameTypes.slot.label}` : `🎡 ${copy.gameTypes.wheel.label}`} />
          </SummaryCard>

          <SummaryCard title={copy.ratesTitle}>
            <Row label={copy.rows.overallWin} val={`%${st.winRate}`} />
            <Row label={copy.rows.jackpotChance} val={`%${(probabilities.jackpot * 100).toFixed(2)}`} accent />
            {probabilities.symbols.map(({ id, prob }) => (
              <Row key={id} label={ratesLabelFor(id)} val={`%${(prob * 100).toFixed(2)}`} />
            ))}
            <Row label={copy.noReward} val={`%${(probabilities.lose * 100).toFixed(1)}`} dim />
          </SummaryCard>
        </div>

        {/* Right: reward list */}
        <SummaryCard title={copy.rewardSummary}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {jackpotRow.icon}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ffd84e" }}>{jackpotRow.label}</div>
                <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)" }}>{jackpotRow.reward}</div>
                <div style={{ fontSize: 10, color: "rgba(244,239,230,0.35)", fontFamily: "monospace" }}>{jackpotRow.coupon}</div>
              </div>
            </div>
            {prizeRows.map((row) => (
              <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {row.icon}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.85)" }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(244,239,230,0.5)" }}>{row.reward}</div>
                  <div style={{ fontSize: 10, color: "rgba(244,239,230,0.35)", fontFamily: "monospace" }}>{row.coupon}</div>
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>

      {saved && (
        <div style={{ padding: 20, borderRadius: 16, background: "rgba(142,242,161,0.08)", border: "1px solid rgba(142,242,161,0.22)", color: "#8ef2a1" }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>✓ {copy.saved}</div>
          <div style={{ marginTop: 6, color: "rgba(210,255,218,0.78)", fontSize: 13, lineHeight: 1.45 }}>
            {copy.savedPackage.replace("{plan}", `${selectedPlanLabel} · ${selectedPlanPrice}`)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <a href="/dashboard" style={successActionPrimary}>{copy.goDashboard}</a>
            <a href={checkoutHref} style={successActionSecondary}>{copy.goPayment}</a>
            <a href={`/play/${st.slug}`} target="_blank" rel="noreferrer" style={successActionSecondary}>{copy.customerPage}</a>
          </div>
        </div>
      )}

      {saveError && (
        <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,126,90,0.1)", border: "1px solid rgba(255,126,90,0.28)", color: "#ffb199", fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: "#ffdfd2" }}>{copy.paymentFailed}</strong>
          <div style={{ marginTop: 6 }}>{saveError}</div>
          <div style={{ marginTop: 10, color: "rgba(255,223,210,0.72)" }}>
            {copy.paymentPendingHelp}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onBack} style={secondaryBtn} type="button">{saved ? `← ${copy.keepEditing}` : `← ${copy.back}`}</button>
        {saved ? (
          <a href={checkoutHref} style={{ ...primaryBtn, flex: 1, textAlign: "center", textDecoration: "none" }}>
            {copy.goPayment}
          </a>
        ) : (
          <button
            onClick={onSave}
            disabled={saving}
            style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, flex: 1 }}
            type="button"
          >
            {saving ? copy.saving : copy.saveAndCheckout}
          </button>
        )}
      </div>
      <div style={{ marginTop: -20, color: "rgba(244,239,230,0.38)", fontSize: 12, lineHeight: 1.5 }}>
        {copy.checkoutAfterSave}
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

/* Info box — explains Pro campaign analytics + example reward texts */
function CampaignInfoBox({ copy }: { copy: StudioCopy }) {
  return (
    <div style={{
      background: "rgba(255,216,78,0.05)",
      border: "1px solid rgba(255,216,78,0.18)",
      borderRadius: 14, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 15 }}>📊</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffd84e" }}>{copy.campaignInfoTitle}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "rgba(244,239,230,0.6)" }}>
        {copy.campaignInfoBody}
      </p>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(244,239,230,0.4)", marginBottom: 7 }}>
          {copy.campaignExamplesLabel}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {copy.campaignExamples.map((ex) => (
            <span key={ex} style={{
              fontSize: 12, fontWeight: 600, color: "rgba(244,239,230,0.8)",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999, padding: "5px 12px",
            }}>{ex}</span>
          ))}
        </div>
      </div>
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
  icon, label, isJackpot = false, reward, coupon, onReward, onCoupon, rewardPlaceholder, couponPlaceholder,
}: {
  icon: React.ReactNode;
  label: string;
  isJackpot?: boolean;
  reward: string;
  coupon: string;
  onReward: (v: string) => void;
  onCoupon: (v: string) => void;
  rewardPlaceholder: string;
  couponPlaceholder: string;
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
        placeholder={rewardPlaceholder}
        style={inputStyle}
      />
      <input
        value={coupon}
        onChange={(e) => onCoupon(e.target.value)}
        placeholder={couponPlaceholder}
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

function NavRow({ onBack, onNext, nextLabel, backLabel = "Geri", nextDisabled }: { onBack?: () => void; onNext: () => void; nextLabel: string; backLabel?: string; nextDisabled?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
      {onBack && <button onClick={onBack} style={secondaryBtn} type="button">← {backLabel}</button>}
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
      id: id as string,
      prob: total > 0 ? symWin * ((symCfg[id]?.share ?? 0) / total) : 0,
    })),
  };
}
