import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/** Price IDs from your Stripe dashboard — set in .env / Vercel env vars */
export const PRICE_IDS = {
  kampanya: process.env.STRIPE_PRICE_KAMPANYA!, // ₺499/mo
  pro:      process.env.STRIPE_PRICE_PRO!,      // ₺1299/mo
} as const;

export type PlanKey = keyof typeof PRICE_IDS;

export function planFromPriceId(priceId: string): "kampanya" | "pro" | null {
  if (priceId === PRICE_IDS.kampanya) return "kampanya";
  if (priceId === PRICE_IDS.pro)      return "pro";
  return null;
}

export function tierFromPlan(plan: "kampanya" | "pro"): "standard" | "pro" {
  return plan === "pro" ? "pro" : "standard";
}
