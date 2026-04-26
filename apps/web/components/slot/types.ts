export interface SlotVariantProps {
  tokens: number;
  outcome: string | null;
  animationHint?: "standard" | "win" | "jackpot" | null;
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  venueName?: string;
  onBack?: () => void;
  onReset?: () => void;
  onShowCoupon?: () => void;
  onExit?: () => void;
}
