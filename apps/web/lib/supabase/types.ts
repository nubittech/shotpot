// Hand-written DB types matching db/migrations/002–007
// Replace later with: `npx supabase gen types typescript --project-id iffxaoiwrxsrfpsysqkc > lib/supabase/types.ts`

export type PlanTier = "kampanya" | "isletme";
export type BillingCycle = "monthly" | "yearly";
export type SlotVariantDB = "v1" | "v2" | "v3";
export type Currency = "TRY" | "USD" | "EUR";
export type ReceiptMode = "ocr" | "qr" | "both";
export type InterfaceLanguage = "tr" | "en";
export type VenueTier = "standard" | "pro";
export type LoyaltyTier = "bronze" | "silver" | "gold";
export type GameType = "slot" | "wheel";
export type WheelVariantDB = "boho" | "irish" | "medit" | "paris" | "chalk";

export interface Venue {
  id: string;
  owner_user_id: string | null;
  slug: string;
  name: string;
  plan: PlanTier;
  tier: VenueTier;          // migration 005: standard | pro
  billing_cycle: BillingCycle;
  active: boolean;
  token_threshold: number;
  currency: Currency;
  receipt_mode: ReceiptMode;
  interface_language: InterfaceLanguage;
  timezone: string;
  game_type: GameType;      // migration 007: slot | wheel
  wheel_variant: WheelVariantDB; // migration 007: boho | irish | medit
  gift_daily_enabled: boolean;   // migration 009: daily free gift wheel
  // migration 017: independent gift wheel config
  gift_wheel_variant: WheelVariantDB;
  gift_wheel_cfg: Record<string, { reward: string; coupon: string; share: number }>;
  // migration 011: automatic VIP tier thresholds (reaches a tier on visits OR spend)
  tier_silver_visits: number;
  tier_silver_spend: number;
  tier_gold_visits: number;
  tier_gold_spend: number;
  // migration 014: won-coupon lifetime in days (0 = never expires)
  coupon_validity_days: number;
  // migration 018: QR digital menu add-on flag (independent of pro tier)
  digital_menu_enabled: boolean;
  // migration 021: visual overlay menu editor design (bg image + text layers)
  menu_design: MenuDesign;
  created_at: string;
  updated_at: string;
}

/** Visual overlay menu design (migration 021) */
export interface MenuTextLayer {
  id: string;
  content: string;
  xPct: number;        // top-left X as % of canvas width
  yPct: number;        // top-left Y as % of canvas height
  widthPct: number;    // box width as % of canvas width
  fontSizePct: number; // font size in cqw (% of canvas width)
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  letterSpacing: number; // em
  lineHeight: number;    // unitless
  opacity: number;       // 0..1
  weight: number;        // 400..900
  visible: boolean;
}
export interface MenuDesign {
  bgUrl?: string;
  aspect?: number;       // height / width of the background
  layers?: MenuTextLayer[];
}

/** QR digital menu category (migration 018) */
export interface DigitalMenuCategory {
  id: string;
  venue_id: string;
  name: string;
  name_en: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Live chat conversation (migration 020) */
export interface ChatConversation {
  id: string;
  visitor_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: "open" | "closed";
  mode: "ai" | "human";
  locale: string;
  last_message_at: string;
  last_visitor_at: string | null;
  admin_seen_at: string | null;
  created_at: string;
}

/** Live chat message (migration 020) */
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "visitor" | "ai" | "admin";
  content: string;
  created_at: string;
}

/** QR digital menu service application (migration 019) */
export interface DigitalMenuApplication {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  message: string | null;
  photo_urls: string[];
  status: "new" | "contacted" | "done" | "rejected";
  venue_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

/** QR digital menu item (migration 018) */
export interface DigitalMenuItem {
  id: string;
  venue_id: string;
  category_id: string | null;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number | null;
  image_url: string | null;
  tags: string[];
  is_available: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Personalized campaign menu (migration 010) */
export interface CustomerMenu {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  audience: "all" | "active30" | "dormant30" | "loyalty_gold" | "consented";
  active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}

/** A line item inside a personalized campaign menu (migration 010) */
export interface CustomerMenuItem {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  old_price: number | null;
  new_price: number | null;
  sort_order: number;
  created_at: string;
}

/** Gift wheel spin grant (migration 009) — receipt-free spin */
export interface GiftSpin {
  id: string;
  venue_id: string;
  customer_id: string;
  source: "manual" | "daily";
  status: "pending" | "used";
  gift_date: string | null;
  reward_label: string | null;
  coupon_id: string | null;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
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

/** Spin-reward campaign config (migration 002) */
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

/** Web push subscription (migration 016) */
export interface PushSubscription {
  id: string;
  customer_id: string;
  venue_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

/** Pro tier customer account (migration 005) */
export interface CustomerPro {
  id: string;
  venue_id: string;
  auth_user_id: string | null;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  birth_date: string | null;
  consent_marketing: boolean;
  consent_kvkk: boolean;
  loyalty_tier: LoyaltyTier;
  total_visits: number;
  total_spend: number;
  last_visit_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

/** Marketing campaign (migration 005) */
export interface MarketingCampaign {
  id: string;
  venue_id: string;
  title: string;
  body: string;
  image_url: string | null;
  reward_label: string | null;
  audience_filter: Record<string, unknown>;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  opened_count: number;
  redeemed_count: number;
  created_by: string | null;
  created_at: string;
}

/** Marketing campaign delivery (migration 005) */
export interface CampaignDelivery {
  id: string;
  campaign_id: string;
  customer_id: string;
  delivered_at: string;
  opened_at: string | null;
  redeemed_at: string | null;
  coupon_id: string | null;
}

/** Legacy customer type (pre-005) — kept for backward compat */
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
  receipt_date: string | null;
  amount_cents: number | null;
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
      venues:              { Row: Venue;             Insert: Partial<Venue>;             Update: Partial<Venue>; };
      symbol_configs:      { Row: SymbolConfig;      Insert: Partial<SymbolConfig>;      Update: Partial<SymbolConfig>; };
      campaigns:           { Row: Campaign;          Insert: Partial<Campaign>;          Update: Partial<Campaign>; };
      customers:           { Row: CustomerPro;       Insert: Partial<CustomerPro>;       Update: Partial<CustomerPro>; };
      marketing_campaigns: { Row: MarketingCampaign; Insert: Partial<MarketingCampaign>; Update: Partial<MarketingCampaign>; };
      // Note: `campaigns` table holds spin-reward configs (migration 002 schema)
      campaign_deliveries: { Row: CampaignDelivery;  Insert: Partial<CampaignDelivery>;  Update: Partial<CampaignDelivery>; };
      receipts:            { Row: Receipt;           Insert: Partial<Receipt>;           Update: Partial<Receipt>; };
      spins:               { Row: Spin;              Insert: Partial<Spin>;              Update: Partial<Spin>; };
      coupons:             { Row: Coupon;            Insert: Partial<Coupon>;            Update: Partial<Coupon>; };
      gift_spins:          { Row: GiftSpin;          Insert: Partial<GiftSpin>;          Update: Partial<GiftSpin>; };
      customer_menus:      { Row: CustomerMenu;      Insert: Partial<CustomerMenu>;      Update: Partial<CustomerMenu>; };
      customer_menu_items: { Row: CustomerMenuItem;  Insert: Partial<CustomerMenuItem>;  Update: Partial<CustomerMenuItem>; };
      push_subscriptions:  { Row: PushSubscription;  Insert: Partial<PushSubscription>;  Update: Partial<PushSubscription>; };
      digital_menu_categories: { Row: DigitalMenuCategory; Insert: Partial<DigitalMenuCategory>; Update: Partial<DigitalMenuCategory>; };
      digital_menu_items:      { Row: DigitalMenuItem;     Insert: Partial<DigitalMenuItem>;     Update: Partial<DigitalMenuItem>; };
      digital_menu_applications: { Row: DigitalMenuApplication; Insert: Partial<DigitalMenuApplication>; Update: Partial<DigitalMenuApplication>; };
      chat_conversations:      { Row: ChatConversation;    Insert: Partial<ChatConversation>;    Update: Partial<ChatConversation>; };
      chat_messages:           { Row: ChatMessage;         Insert: Partial<ChatMessage>;         Update: Partial<ChatMessage>; };
    };
  };
}
