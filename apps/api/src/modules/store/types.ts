export type RewardRule = {
  id: string;
  name: string;
  probability: number;
  couponCodePrefix: string;
};

export type BusinessConfig = {
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
  rewards: Array<{
    icon: string;
    label: string;
  }>;
};

export type ReceiptRecord = {
  id: string;
  userId: string;
  businessId: string;
  amount: number;
  issuedAt: string;
  fingerprint: string;
  imageHash: string;
  imageData?: string;
  ocrStatus: "accepted" | "rejected";
  ocrSummary?: string;
  valid: boolean;
  rejectReason?: string;
};

export type SpinRecord = {
  id: string;
  userId: string;
  businessId: string;
  receiptId: string;
  rewardName: string;
  win: boolean;
  createdAt: string;
};

export type CouponRecord = {
  id: string;
  userId: string;
  businessId: string;
  rewardName: string;
  code: string;
  redeemedAt?: string;
};
