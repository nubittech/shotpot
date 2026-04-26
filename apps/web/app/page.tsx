"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { ReceiptScanner } from "../components/ReceiptScanner";
import { SlotMachine, type SlotVariant } from "../components/SlotMachine";

type ReceiptResponse = {
  id: string;
  valid: boolean;
  rejectReason?: string;
  ocrStatus?: "accepted" | "rejected";
  ocrSummary?: string;
};

type Coupon = {
  id: string;
  code: string;
  rewardName: string;
  redeemedAt?: string;
};

type SpinResponse = {
  outcome: string;
  win: boolean;
  coupon: Coupon | null;
  animationHint?: "standard" | "win" | "jackpot";
};

type RewardRule = {
  id: string;
  name: string;
  probability: number;
  couponCodePrefix: string;
};

type RewardVisual = {
  icon: string;
  label: string;
};

type BusinessConfig = {
  id: string;
  name: string;
  logoSymbol: string;
  headline: string;
  subheadline: string;
  theme: {
    background: string;
    surface: string;
    ink: string;
    accent: string;
    accentSoft: string;
  };
  rewards: RewardVisual[];
};

type GuestTab = "menu" | "jackpot" | "profile";

type ThemePack = {
  id: string;
  name: string;
  theme: BusinessConfig["theme"];
};

const THEME_PACKS: ThemePack[] = [
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    theme: { background: "#111111", surface: "#1c1b1d", ink: "#f6f1e3", accent: "#ffd84e", accentSoft: "#ffd84e" }
  },
  {
    id: "sandstone",
    name: "Sandstone",
    theme: { background: "#f4efe6", surface: "#e9d8a6", ink: "#2c2a30", accent: "#f2b36c", accentSoft: "#f2b36c" }
  },
  {
    id: "ocean-night",
    name: "Ocean Night",
    theme: { background: "#1c1b1d", surface: "#2c2a30", ink: "#f6f1e3", accent: "#3b82f6", accentSoft: "#3b82f6" }
  },
  {
    id: "mint-cream",
    name: "Mint Cream",
    theme: { background: "#f6f1e3", surface: "#f4efe6", ink: "#2c2a30", accent: "#34d399", accentSoft: "#34d399" }
  },
  {
    id: "sunset-pop",
    name: "Sunset Pop",
    theme: { background: "#2c2a30", surface: "#1c1b1d", ink: "#f6f1e3", accent: "#f2b36c", accentSoft: "#f2b36c" }
  },
  {
    id: "violet-night",
    name: "Violet Night",
    theme: { background: "#2c2a30", surface: "#111111", ink: "#f4efe6", accent: "#d06cff", accentSoft: "#d06cff" }
  }
];

const fallbackConfig: BusinessConfig = {
  id: "default-business",
  name: "Electric Speakeasy",
  logoSymbol: "ES",
  headline: "Gecenin Ritmi",
  subheadline: "Modern gastronomi deneyimi",
  theme: THEME_PACKS[0].theme,
  rewards: [
    { icon: "🍸", label: "Electric Gin Fizz" },
    { icon: "🍟", label: "Truflu Patates" },
    { icon: "🎟", label: "Jackpot Kuponu" }
  ]
};

const fallbackRules: RewardRule[] = [
  { id: "r0", name: "Logo Jackpot", probability: 0.10, couponCodePrefix: "JACKPOT" },
  { id: "r1", name: "Free Latte", probability: 0.25, couponCodePrefix: "LATTE" },
  { id: "r2", name: "Free Suffle", probability: 0.15, couponCodePrefix: "SUFLE" },
  { id: "r3", name: "No Reward", probability: 0.50, couponCodePrefix: "LOSE" }
];

const menuCards = [
  { title: "Icekler", subtitle: "Signature kokteyller", price: "240 TL'den", image: "🍸" },
  { title: "Atistirmaliklar", subtitle: "Paylasimli lezzetler", price: "120 TL'den", image: "🍔" },
  { title: "Tatlılar", subtitle: "Gecenin son dokunusu", price: "180 TL'den", image: "🍰" }
];

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const businessId = "default-business";
  const userId = "demo-user-1";

  const [guestTab, setGuestTab] = useState<GuestTab>("menu");
  const [config, setConfig] = useState<BusinessConfig>(() => normalizeConfig(fallbackConfig));
  const [draftConfig, setDraftConfig] = useState<BusinessConfig>(() => normalizeConfig(fallbackConfig));
  const [rewardRules, setRewardRules] = useState<RewardRule[]>(fallbackRules);
  const [draftRules, setDraftRules] = useState<RewardRule[]>(fallbackRules);
  const [slotVariant, setSlotVariant] = useState<SlotVariant>("v1");

  const [issuedAt, setIssuedAt] = useState(localDateTimeNow());
  const [amount, setAmount] = useState(180);
  const [imageHash, setImageHash] = useState("");
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [receiptImageData, setReceiptImageData] = useState("");
  const [eligibleReceiptIds, setEligibleReceiptIds] = useState<string[]>([
    "test-token-1",
    "test-token-2",
    "test-token-3",
    "test-token-4",
    "test-token-5"
  ]);
  const [tokenJustLoaded, setTokenJustLoaded] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResponse | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [savingStudio, setSavingStudio] = useState(false);

  useEffect(() => {
    // Try server-side config first (set by /studio wizard, works cross-origin)
    fetch("/api/studio-config")
      .then((r) => r.json())
      .then((data) => {
        if (!data) return;
        const d = data as {
          name: string; logoSymbol: string; slotVariant: SlotVariant;
          rewards: BusinessConfig["rewards"]; rules: RewardRule[];
        };
        setConfig((prev) => normalizeConfig({ ...prev, name: d.name, logoSymbol: d.logoSymbol, rewards: d.rewards }));
        setSlotVariant(d.slotVariant);
        if (d.rules?.length) setRewardRules(d.rules);
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem("rr_studio_config");
          if (saved) {
            const d = JSON.parse(saved) as {
              name: string; logoSymbol: string; slotVariant: SlotVariant;
              rewards: BusinessConfig["rewards"]; rules: RewardRule[];
            };
            setConfig((prev) => normalizeConfig({ ...prev, name: d.name, logoSymbol: d.logoSymbol, rewards: d.rewards }));
            setSlotVariant(d.slotVariant);
            if (d.rules?.length) setRewardRules(d.rules);
          }
        } catch {}
      });
    void loadBusinessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBusinessData() {
    try {
      const [configResponse, rulesResponse] = await Promise.all([
        fetch(`${apiBase}/business/${businessId}/config`),
        fetch(`${apiBase}/business/${businessId}/reward-rules`)
      ]);

      if (configResponse.ok) {
        const configData = (await configResponse.json()) as BusinessConfig;
        const normalizedConfig = normalizeConfig(configData);
        setConfig(normalizedConfig);
        setDraftConfig(normalizedConfig);
      }

      if (rulesResponse.ok) {
        const rulesData = (await rulesResponse.json()) as RewardRule[];
        if (rulesData.length > 0) {
          setRewardRules(rulesData);
          setDraftRules(rulesData);
        }
      }
    } catch {
      // backend unavailable — use fallback config
    }
  }

  async function handleCapture(payload: { previewUrl: string; hash: string; imageData: string }) {
    setReceiptPreview(payload.previewUrl);
    setImageHash(payload.hash);
    setReceiptImageData(payload.imageData);
    setReceipt(null);
    setSpinResult(null);
    setCoupon(null);
  }

  async function validateReceipt() {
    if (!imageHash || !receiptImageData) return;

    setLoadingReceipt(true);
    try {
      const response = await fetch(`${apiBase}/receipts/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          businessId,
          businessName: config.name,
          amount,
          issuedAt: new Date(issuedAt).toISOString(),
          imageHash,
          imageData: receiptImageData
        })
      });

      const data = (await response.json()) as ReceiptResponse;
      setReceipt(data);
      if (data.valid) {
        setEligibleReceiptIds((current) => (current.includes(data.id) ? current : [...current, data.id]));
        setTokenJustLoaded(true);
      }
    } finally {
      setLoadingReceipt(false);
    }
  }

  function localSpin(): SpinResponse {
    const rules = rewardRules;
    const roll = Math.random();
    let acc = 0;
    for (const rule of rules) {
      acc += Number(rule.probability);
      if (roll < acc) {
        const isLose = rule.couponCodePrefix === "LOSE" || rule.name === "No Reward";
        const isJackpot = rule.couponCodePrefix === "JACKPOT" || rule.name.toLowerCase().includes("jackpot");
        const code = isLose ? "" : `${rule.couponCodePrefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        return {
          outcome: rule.name,
          win: !isLose,
          coupon: isLose ? null : { id: code, code, rewardName: rule.name },
          animationHint: isJackpot ? "jackpot" : isLose ? "standard" : "win",
        };
      }
    }
    return { outcome: "No Reward", win: false, coupon: null, animationHint: "standard" };
  }

  async function pullLever() {
    const activeReceiptId = eligibleReceiptIds[0];
    if (!activeReceiptId || spinning) return;

    setSpinning(true);
    setSpinResult(null);
    setCoupon(null);

    try {
      const response = await fetch(`${apiBase}/games/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, businessId, receiptId: activeReceiptId })
      });

      if (!response.ok) throw new Error("not ok");
      const data = (await response.json()) as SpinResponse;
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
      setEligibleReceiptIds((current) => current.slice(1));
      setSpinResult(data);
      setCoupon(data.coupon);
    } catch {
      // Backend unavailable — spin locally
      const data = localSpin();
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
      setEligibleReceiptIds((current) => current.slice(1));
      setSpinResult(data);
      setCoupon(data.coupon);
    } finally {
      setSpinning(false);
    }
  }

  async function redeemCoupon() {
    if (!coupon?.id || coupon.redeemedAt) return;
    setRedeeming(true);
    try {
      const response = await fetch(`${apiBase}/coupons/${coupon.id}/redeem`, {
        method: "POST"
      });
      if (!response.ok) return;
      setCoupon((await response.json()) as Coupon);
    } finally {
      setRedeeming(false);
    }
  }

  async function saveStudio() {
    setSavingStudio(true);
    try {
      const rulesTotal = draftRules.reduce((sum, rule) => sum + Number(rule.probability), 0);
      const normalizedRules =
        Math.abs(rulesTotal - 1) < 0.0001
          ? draftRules
          : draftRules.map((rule) => ({
              ...rule,
              probability: Number((rule.probability / rulesTotal).toFixed(4))
            }));

      await Promise.all([
        fetch(`${apiBase}/business/${businessId}/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draftConfig.name,
            logoSymbol: draftConfig.logoSymbol,
            headline: draftConfig.headline,
            subheadline: draftConfig.subheadline,
            background: draftConfig.theme.background,
            surface: draftConfig.theme.surface,
            ink: draftConfig.theme.ink,
            accent: draftConfig.theme.accent,
            accentSoft: draftConfig.theme.accentSoft,
            rewards: draftConfig.rewards
          })
        }),
        fetch(`${apiBase}/business/${businessId}/reward-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rules: normalizedRules.map((rule) => ({
              name: rule.name,
              probability: Number(rule.probability),
              couponCodePrefix: rule.couponCodePrefix
            }))
          })
        })
      ]);

      setConfig(draftConfig);
      setRewardRules(normalizedRules);
      setDraftRules(normalizedRules);
    } finally {
      setSavingStudio(false);
    }
  }

  const receiptStatus = useMemo(() => {
    if (!receipt) return "Jeton almak icin once fisini kameradan cek.";
    if (receipt.valid) {
      return `OCR ve fraud kontrolu kabul etti. ${receipt.ocrSummary ?? "Receipt parse basarili."} 1 jeton hesaba eklendi.`;
    }
    return `Fis kabul edilmedi: ${receipt.rejectReason}`;
  }, [receipt]);

  const probabilityTotal = useMemo(
    () => draftRules.reduce((sum, rule) => sum + Number(rule.probability), 0),
    [draftRules]
  );
  const activeTheme = config.theme;
  const selectedThemePackId = useMemo(() => findThemePackByTheme(draftConfig.theme)?.id ?? THEME_PACKS[0].id, [draftConfig.theme]);
  const activeMuted = hexToRgba(activeTheme.ink, 0.66);
  const activeLine = hexToRgba(activeTheme.accent, 0.24);

  return (
    <main
      className="page"
      style={
        {
          "--bg": activeTheme.background,
          "--surface": activeTheme.surface,
          "--ink": activeTheme.ink,
          "--accent": activeTheme.accent,
          "--accent-soft": activeTheme.accentSoft,
          "--muted": activeMuted,
          "--line": activeLine
        } as CSSProperties
      }
    >
      <section className="guest-shell">
        <div className="mobile-frame">
              {guestTab === "menu" && (
                <div className="screen-stack">
                  <div className="hero-poster">
                    <div className="hero-copy-block">
                      <h2>{config.headline}</h2>
                      <p>{config.subheadline}</p>
                    </div>
                    <div className="hero-glass">45+ SECKENEK</div>
                  </div>

                  <div className="grid-cards">
                    {menuCards.map((card) => (
                      <article className="food-card" key={card.title}>
                        <div className="food-thumb">{card.image}</div>
                        <strong>{card.title}</strong>
                        <span>{card.subtitle}</span>
                        <b>{card.price}</b>
                      </article>
                    ))}
                  </div>

                  <div className="section-row">
                    <h3>Populer Secimler</h3>
                    <button className="ghost-link" onClick={() => setGuestTab("jackpot")} type="button">
                      TUMUNU GOR
                    </button>
                  </div>

                  <div className="menu-list">
                    {config.rewards.map((reward) => (
                      <div className="menu-list-item" key={reward.label}>
                        <div className="menu-list-thumb">{reward.icon}</div>
                        <div>
                          <strong>{reward.label}</strong>
                          <span>QR menuden jackpot'a gecis icin one cikan odul</span>
                          <b>Jackpot odulu</b>
                        </div>
                        <button className="plus-button" onClick={() => setGuestTab("jackpot")} type="button">
                          +
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="jackpot-promo">
                    <div>
                      <span className="promo-title">SANSINI DENE!</span>
                      <p>Siparisini bitir, fişi cek, jetonsuz oyunlara degil gercek odule gir.</p>
                    </div>
                    <button className="jackpot-banner-button" onClick={() => setGuestTab("jackpot")} type="button">
                      JACKPOT
                    </button>
                  </div>
                </div>
              )}

              {guestTab === "jackpot" && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 10,
                  display: "flex", flexDirection: "column",
                  background: "#08060a",
                }}>
                  <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                    <SlotMachine
                      animationHint={spinResult?.animationHint ?? null}
                      canSpin={eligibleReceiptIds.length > 0}
                      logoSymbol={config.logoSymbol}
                      onSpin={pullLever}
                      outcome={spinResult?.outcome ?? null}
                      spinning={spinning}
                      tokens={eligibleReceiptIds.length}
                      variant={slotVariant}
                    />
                  </div>

                  <div style={{ padding: "12px 20px 90px", flexShrink: 0, background: "#08060a" }}>
                    <button className="jackpot-banner-button wide" onClick={() => setGuestTab("profile")} type="button">
                      JETON HAKKI ICIN FIS YUKLE
                    </button>
                    <div className="stage-stats" style={{ marginTop: 8 }}>
                      <span>SON KAZANAN @nocturne_99</span>
                      <span>JACKPOT 2,500 Jeton</span>
                    </div>
                  </div>
                </div>
              )}

              {guestTab === "profile" && (
                <ReceiptScanner
                  onBack={() => setGuestTab("jackpot")}
                  onCapture={handleCapture}
                  venueName={config.name}
                />
              )}

              <nav className="bottom-nav">
                <button className={`nav-item ${guestTab === "menu" ? "is-active" : ""}`} onClick={() => setGuestTab("menu")} type="button">
                  MENU
                </button>
                <button className={`nav-item ${guestTab === "jackpot" ? "is-active" : ""}`} onClick={() => setGuestTab("jackpot")} type="button">
                  JACKPOT
                </button>
                <button className={`nav-item ${guestTab === "profile" ? "is-active" : ""}`} onClick={() => setGuestTab("profile")} type="button">
                  PROFILE
                </button>
              </nav>

              {tokenJustLoaded && (
                <div className="modal-backdrop">
                  <div className="token-modal">
                    <div className="token-check">✓</div>
                    <h3>JETON YUKLENDI!</h3>
                    <p>Sansin simdi basliyor. Buyuk odul sadece bir hamle uzaklikta.</p>
                    <button
                      className="jackpot-banner-button wide"
                      onClick={() => {
                        setTokenJustLoaded(false);
                        setGuestTab("jackpot");
                      }}
                      type="button"
                    >
                      HAZIRIM!
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
      </main>
  );
}

function normalizeTheme(theme: BusinessConfig["theme"]) {
  const matchedPack = findThemePackByTheme(theme);
  return matchedPack ? matchedPack.theme : THEME_PACKS[0].theme;
}

function extractFirstHex(value: string) {
  const firstHex = value.match(/#[0-9a-fA-F]{6}/)?.[0];
  return firstHex ?? value;
}

function findThemePackByTheme(theme: BusinessConfig["theme"]) {
  const normalizedTheme = {
    background: extractFirstHex(theme.background).toLowerCase(),
    surface: extractFirstHex(theme.surface).toLowerCase(),
    ink: extractFirstHex(theme.ink).toLowerCase(),
    accent: extractFirstHex(theme.accent).toLowerCase()
  };

  return THEME_PACKS.find((pack) => {
    return (
      pack.theme.background.toLowerCase() === normalizedTheme.background &&
      pack.theme.surface.toLowerCase() === normalizedTheme.surface &&
      pack.theme.ink.toLowerCase() === normalizedTheme.ink &&
      pack.theme.accent.toLowerCase() === normalizedTheme.accent
    );
  });
}

function hexToRgba(hex: string, alpha: number) {
  const candidate = extractFirstHex(hex);
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate.replace("#", "") : "f6f1e3";
  const intValue = Number.parseInt(safeHex, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeConfig(config: BusinessConfig): BusinessConfig {
  return {
    ...config,
    theme: normalizeTheme(config.theme)
  };
}

function localDateTimeNow() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
