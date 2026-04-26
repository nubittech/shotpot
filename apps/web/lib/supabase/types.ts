// Hand-written DB types matching db/migrations/002_jackpot_saas.sql + 003_currency_receipt_mode.sql
// Replace later with: `npx supabase gen types typescript --project-id iffxaoiwrxsrfpsysqkc > lib/supabase/types.ts`

export type PlanTier = "kampanya" | "isletme";
export type BillingCycle = "monthly" | "yearly";
export type SlotVariantDB = "v1" | "v2" | "v3";
export type Currency = "TRY" | "USD" | "EUR";
export type ReceiptMode = "ocr" | "qr" | "both";

export interface Venue {
  id: string;
  owner_user_id: string | null;
  slug: string;
  name: string;
  plan: PlanTier;
  billing_cycle: BillingCycle;
  active: boolean;
  token_threshold: number;
  currency: Currency;
  receipt_mode: ReceiptMode;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SymbolConfig {
  venue_id: string;
  variant: SlotVariantDB;
  win_rate: number;
  jackpot_share: number;
  jackpot_reward: string;
  jackpot_coupon_prefix: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  venue_id: string;
  symbol_id: string;
  reward_label: string;
  coupon_prefix: string;
  share: number;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  venue_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Receipt {
  id: string;
  venue_id: string;
  customer_id: string | null;
  guest_token: string | null;
  amount: number;
  tokens_awarded: number;
  issued_at: string;
  fingerprint: string;
  image_url: string | null;
  ocr_status: string | null;
  ocr_summary: string | null;
  valid: boolean;
  reject_reason: string | null;
  created_at: string;
}

export interface Spin {
  id: string;
  venue_id: string;
  customer_id: string | null;
  guest_token: string | null;
  receipt_id: string;
  campaign_id: string | null;
  is_jackpot: boolean;
  win: boolean;
  outcome: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  venue_id: string;
  customer_id: string | null;
  guest_token: string | null;
  spin_id: string | null;
  code: string;
  reward_label: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string | null;
  created_at: string;
}

// Minimal Database type for typed supabase-js queries
export interface Database {
  public: {
    Tables: {
      venues:         { Row: Venue;        Insert: Partial<Venue>;        Update: Partial<Venue>; };
      symbol_configs: { Row: SymbolConfig; Insert: Partial<SymbolConfig>; Update: Partial<SymbolConfig>; };
      campaigns:      { Row: Campaign;     Insert: Partial<Campaign>;     Update: Partial<Campaign>; };
      customers:      { Row: Customer;     Insert: Partial<Customer>;     Update: Partial<Customer>; };
      receipts:       { Row: Receipt;      Insert: Partial<Receipt>;      Update: Partial<Receipt>; };
      spins:          { Row: Spin;         Insert: Partial<Spin>;         Update: Partial<Spin>; };
      coupons:        { Row: Coupon;       Insert: Partial<Coupon>;       Update: Partial<Coupon>; };
    };
  };
}
