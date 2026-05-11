import { NextResponse } from "next/server";
import {
  PADDLE_CLIENT_TOKEN,
  PADDLE_ENVIRONMENT,
  PADDLE_PRICE_IDS,
  PADDLE_PRICE_IDS_ANNUAL,
  type PlanKey,
} from "../../../../lib/paddle";

type BillingPeriod = "monthly" | "annual";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get("plan") === "pro" ? "pro" : "kampanya";
  const period: BillingPeriod = searchParams.get("period") === "annual" ? "annual" : "monthly";

  const prices: Record<BillingPeriod, Record<PlanKey, string>> = {
    monthly: PADDLE_PRICE_IDS,
    annual: PADDLE_PRICE_IDS_ANNUAL,
  };
  const priceId = prices[period][plan];

  if (!PADDLE_CLIENT_TOKEN || !priceId) {
    return NextResponse.json({ error: "Paddle checkout config is missing" }, { status: 500 });
  }

  return NextResponse.json({
    environment: PADDLE_ENVIRONMENT,
    clientToken: PADDLE_CLIENT_TOKEN,
    priceId,
  });
}
