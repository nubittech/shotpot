"use client";

import { V1Classic } from "./slot/V1Classic";
import { V2Neon } from "./slot/V2Neon";
import { V3Deco } from "./slot/V3Deco";

export type SlotVariant = "v1" | "v2" | "v3";
export type SlotLabels = {
  tokens: string;
  payline: string;
  jackpotLine: string;
  receiptVerified: string;
  receiptVerifiedShort: string;
  triplePays: string;
  won: string;
  ready: string;
  couponAdded: string;
  showCoupon: string;
  notThisRound: string;
  nextTime: string;
  tryAgainHint: string;
  scanAgainHint: string;
  retry: string;
  exit: string;
  backMenu: string;
};

type SlotMachineProps = {
  tokens: number;
  outcome: string | null;
  animationHint?: "standard" | "win" | "jackpot" | null;
  logoSymbol: string;
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  variant?: SlotVariant;
  labels?: SlotLabels;
  venueName?: string;
  onBack?: () => void;
  onReset?: () => void;
  onShowCoupon?: () => void;
  onExit?: () => void;
};

export function SlotMachine({
  tokens,
  outcome,
  animationHint,
  spinning,
  canSpin,
  onSpin,
  variant = "v1",
  labels,
  venueName,
  onBack,
  onReset,
  onShowCoupon,
  onExit,
}: SlotMachineProps) {
  const props = { tokens, outcome, animationHint, spinning, canSpin, onSpin, venueName, labels, onBack, onReset, onShowCoupon, onExit };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 520, borderRadius: 22, overflow: "hidden" }}>
      {variant === "v1" && <V1Classic {...props} />}
      {variant === "v2" && <V2Neon {...props} />}
      {variant === "v3" && <V3Deco {...props} />}
    </div>
  );
}
