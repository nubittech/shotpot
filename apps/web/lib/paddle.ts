export type PlanKey = "kampanya" | "pro";

export const PADDLE_PRICE_IDS: Record<PlanKey, string> = {
  kampanya: process.env.PADDLE_PRICE_KAMPANYA ?? "",
  pro:      process.env.PADDLE_PRICE_PRO ?? "",
};

export const PADDLE_PRICE_IDS_ANNUAL: Record<PlanKey, string> = {
  kampanya: process.env.PADDLE_PRICE_KAMPANYA_ANNUAL ?? "",
  pro:      process.env.PADDLE_PRICE_PRO_ANNUAL ?? "",
};

export const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
export const PADDLE_VENDOR_ID    = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID ?? "";
export const PADDLE_ENVIRONMENT  = (process.env.PADDLE_ENVIRONMENT ?? "sandbox") as "sandbox" | "production";

export function tierFromPlan(plan: PlanKey): "standard" | "pro" {
  return plan === "pro" ? "pro" : "standard";
}

/** Verify a webhook from Paddle using the secret key */
export async function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Paddle uses SHA-256 HMAC with the webhook secret
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Buffer.from(signature, "hex");
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(rawBody));
}
