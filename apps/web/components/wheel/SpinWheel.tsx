"use client";

import dynamic from 'next/dynamic';

export type WheelVariant = 'boho' | 'irish' | 'medit';

export type WheelResult = {
  win: boolean;
  isJackpot: boolean;
  rewardLabel: string;
  couponCode: string;
} | null;

export type SpinWheelProps = {
  variant?: WheelVariant;
  venueName?: string;
  locale?: "tr" | "en";
  /** External: whether the user can trigger a spin */
  canSpin: boolean;
  /** External: API call is in-flight */
  spinning: boolean;
  /** External: tokens available */
  tokens: number;
  /** External: set after API responds */
  result: WheelResult;
  onSpin: () => void;
  onShowCoupon: () => void;
  onBack: () => void;
  onReset: () => void;
};

// Dynamically import wheel variants (they use window globals in original)
const WheelBoho = dynamic(() => import('./WheelBoho'), { ssr: false });
const WheelIrish = dynamic(() => import('./WheelIrish'), { ssr: false });
const WheelMedit = dynamic(() => import('./WheelMedit'), { ssr: false });

export default function SpinWheel({
  variant = 'boho',
  venueName,
  locale = 'tr',
  canSpin,
  spinning,
  tokens,
  result,
  onSpin,
  onShowCoupon,
  onBack,
  onReset,
}: SpinWheelProps) {
  // Derive outcome for internal wheel engine
  const outcome: 'win' | 'lose' = result ? (result.win ? 'win' : 'lose') : 'win';

  const sharedProps = {
    venueName,
    locale,
    canSpin,
    spinning,
    tokens,
    result,
    outcome,
    onSpin,
    onShowCoupon,
    onBack,
    onReset,
  };

  if (variant === 'irish') return <WheelIrish {...sharedProps} />;
  if (variant === 'medit') return <WheelMedit {...sharedProps} />;
  return <WheelBoho {...sharedProps} />;
}
