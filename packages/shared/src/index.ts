export type RewardOutcome = {
  spinId: string;
  outcome: string;
  win: boolean;
  animationHint: "standard" | "win" | "jackpot";
};

export type ReceiptValidationResult = {
  found: boolean;
  valid: boolean;
  reason?: string;
};
