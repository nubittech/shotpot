import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { differenceInMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getServiceClient } from "../../../../lib/supabase/server";
import { computeTier, tierThresholdsFromVenue } from "../../../../lib/loyalty";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type OcrRequest = {
  imageData: string;   // base64 data URL  e.g. "data:image/jpeg;base64,..."
  hash: string;        // SHA-256 fingerprint from client
  slug: string;
  guestToken: string;
  customerId?: string; // Pro tier: link receipt to customer account
};

type ReceiptExtract = {
  amount: number | null;
  datetime: string | null;   // ISO-8601 if found, else null
  confidence: number;        // 0..1
  currency_hint: string | null; // e.g. "TRY", "USD", "EUR" if symbol visible
};

/* ─── Extract receipt data via Claude Vision ─── */
async function extractReceiptData(base64Image: string, mimeType: string): Promise<ReceiptExtract> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `You are a receipt parser. Look at this image and extract:
1. The TOTAL amount paid (numeric, e.g. 340.00)
2. The date and time on the receipt (ISO-8601 format if possible, e.g. "2026-04-26T21:34:00")
3. Your confidence this is a real receipt (0.0 to 1.0)
4. Currency symbol visible (TRY/₺, USD/$, EUR/€ — or null)

Respond ONLY with valid JSON, no extra text:
{"amount": 340.00, "datetime": "2026-04-26T21:34:00", "confidence": 0.95, "currency_hint": "TRY"}

If you cannot find a field, use null for that field.
If this is NOT a receipt image, set confidence to 0.1 or lower.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(clean) as ReceiptExtract;
  } catch {
    return { amount: null, datetime: null, confidence: 0, currency_hint: null };
  }
}

/* ─── Main handler ─── */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OcrRequest;
    const { imageData, hash, slug, guestToken, customerId } = body;

    if (!imageData || !hash || !slug) {
      return NextResponse.json({ error: "imageData, hash and slug required" }, { status: 400 });
    }

    const sb = getServiceClient();

    // 1) Fetch venue
    const { data: venue, error: vErr } = await sb
      .from("venues")
      .select("id, name, token_threshold, currency, timezone, active, tier_silver_visits, tier_silver_spend, tier_gold_visits, tier_gold_spend")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (vErr || !venue) {
      return NextResponse.json({ error: "venue not found" }, { status: 404 });
    }

    const v = venue as {
      id: string; name: string; token_threshold: number;
      currency: string; timezone: string; active: boolean;
      tier_silver_visits: number; tier_silver_spend: number;
      tier_gold_visits: number; tier_gold_spend: number;
    };

    // 2) Fingerprint dedup — reject if same hash already used at this venue
    const { data: dupReceipt } = await sb
      .from("receipts")
      .select("id")
      .eq("venue_id", v.id)
      .eq("fingerprint", hash)
      .maybeSingle();

    if (dupReceipt) {
      return NextResponse.json(
        { error: "Bu fiş daha önce kullanıldı.", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    // 3) Parse image + call Claude Vision
    // imageData is "data:<mime>;base64,<data>"
    const [header, b64] = imageData.split(",");
    const mimeMatch = header.match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const extract = await extractReceiptData(b64, mimeType);

    // Debug summary — always included so client can show what AI saw
    const debugInfo = `[AI okudu → güven: ${(extract.confidence * 100).toFixed(0)}% | tutar: ${extract.amount ?? "—"} | tarih: ${extract.datetime ?? "—"}]`;

    // 4) Confidence gate — not a receipt
    if (extract.confidence < 0.3) {
      return NextResponse.json(
        {
          error: `Fiş tanınamadı — fotoğraf çok bulanık veya fiş görünmüyor.\n${debugInfo}`,
          code: "LOW_CONFIDENCE",
          debug: extract,
        },
        { status: 422 }
      );
    }

    // 5) Amount required
    if (!extract.amount || extract.amount <= 0) {
      return NextResponse.json(
        {
          error: `Fiş okundu ama toplam tutar bulunamadı.\n${debugInfo}`,
          code: "NO_AMOUNT",
          debug: extract,
        },
        { status: 422 }
      );
    }

    // 6) Time window check — receipt must be within 60 minutes of now in venue timezone
    if (extract.datetime) {
      const venueTimezone = v.timezone || "Europe/Istanbul";
      const nowInVenueZone = toZonedTime(new Date(), venueTimezone);
      const receiptTime = new Date(extract.datetime);
      const diffMins = Math.abs(differenceInMinutes(receiptTime, nowInVenueZone));

      if (diffMins > 60) {
        return NextResponse.json(
          {
            error: `Fiş ${diffMins} dakika önceye ait — sadece son 1 saat geçerli.\n${debugInfo}`,
            code: "EXPIRED_RECEIPT",
            debug: extract,
          },
          { status: 422 }
        );
      }
    }
    // If no datetime on receipt — we still accept but note it

    // 7) Semantic dedup — reject if same venue + same date + same amount already recorded
    //    This catches the same receipt photographed from a different angle (different hash).
    if (extract.datetime && extract.amount) {
      const receiptDate = extract.datetime.slice(0, 10); // "YYYY-MM-DD"
      const amountCents = Math.round(extract.amount * 100);
      const { data: semanticDup } = await sb
        .from("receipts")
        .select("id")
        .eq("venue_id", v.id)
        .eq("receipt_date", receiptDate)
        .eq("amount_cents", amountCents)
        .maybeSingle();

      if (semanticDup) {
        return NextResponse.json(
          { error: `Bu fiş bugün zaten kullanıldı (${extract.amount} ${v.currency}, ${receiptDate}).\n${debugInfo}`, code: "DUPLICATE" },
          { status: 409 }
        );
      }
    }

    // 8) Calculate tokens
    const tokens = Math.max(1, Math.floor(extract.amount / v.token_threshold));

    // 9) Insert receipt row
    const receiptDate = extract.datetime ? extract.datetime.slice(0, 10) : null;
    const amountCents = extract.amount ? Math.round(extract.amount * 100) : null;

    const { data: insertedReceipt, error: insErr } = await sb.from("receipts").insert({
      venue_id: v.id,
      guest_token: guestToken || null,
      customer_id: customerId || null,
      amount: extract.amount,
      tokens_awarded: tokens,
      fingerprint: hash,
      issued_at: extract.datetime ?? new Date().toISOString(),
      image_url: null,
      ocr_status: "success",
      ocr_summary: JSON.stringify({
        amount: extract.amount,
        datetime: extract.datetime,
        confidence: extract.confidence,
        currency_hint: extract.currency_hint,
      }),
      valid: true,
      reject_reason: null,
      receipt_date: receiptDate,
      amount_cents: amountCents,
    }).select("id").single();

    if (insErr || !insertedReceipt) {
      // Handle unique constraint violation (race condition — two concurrent scans of same receipt)
      if (insErr?.code === "23505") {
        return NextResponse.json(
          { error: `Bu fiş zaten kullanıldı.\n${debugInfo}`, code: "DUPLICATE" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: insErr?.message ?? "receipt insert failed" }, { status: 500 });
    }

    // 10) Update customer stats + loyalty tier (Pro tier only, fire-and-forget)
    if (customerId) {
      const { data: cust } = await sb
        .from("customers")
        .select("total_visits, total_spend, loyalty_tier")
        .eq("id", customerId)
        .maybeSingle();

      if (cust) {
        const c = cust as { total_visits: number; total_spend: number; loyalty_tier: string };
        const newVisits = c.total_visits + 1;
        const newSpend  = Number(c.total_spend) + Number(extract.amount);
        // Automatic VIP tier — reaches a tier on visits OR spend (venue-configured)
        const newTier = computeTier(newVisits, newSpend, tierThresholdsFromVenue(v));

        await sb
          .from("customers")
          .update({
            total_visits: newVisits,
            total_spend: newSpend,
            loyalty_tier: newTier,
            last_visit_at: new Date().toISOString(),
          })
          .eq("id", customerId);
      }
    }

    return NextResponse.json({
      ok: true,
      receiptId: (insertedReceipt as { id: string }).id,
      tokens,
      amount: extract.amount,
      currency: v.currency,
      confidence: extract.confidence,
    });

  } catch (e: unknown) {
    // Anthropic SDK throws an object with status + error body — surface a clean message
    const raw = e instanceof Error ? e.message : String(e);

    // Billing / quota errors
    if (raw.includes("credit balance") || raw.includes("billing") || raw.includes("quota")) {
      return NextResponse.json(
        { error: "Fiş analizi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    // Generic fallback — don't leak raw Anthropic JSON to clients
    console.error("[ocr] unexpected error:", raw);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen tekrar deneyin.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
