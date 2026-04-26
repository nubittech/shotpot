import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../db/database.service";
import { BusinessConfig, CouponRecord, ReceiptRecord, RewardRule, SpinRecord } from "./types";

type ReceiptRow = {
  id: string;
  user_id: string;
  business_id: string;
  amount: string;
  issued_at: string;
  fingerprint: string;
  image_hash: string;
  image_data: string | null;
  ocr_status: "accepted" | "rejected" | null;
  ocr_summary: string | null;
  valid: boolean;
  reject_reason: string | null;
};

type SpinRow = {
  id: string;
  user_id: string;
  business_id: string;
  receipt_id: string;
  reward_name: string;
  win: boolean;
  created_at: string;
};

type CouponRow = {
  id: string;
  user_id: string;
  business_id: string;
  reward_name: string;
  code: string;
  redeemed_at: string | null;
};

type RewardRow = {
  id: string;
  name: string;
  probability: string;
  code_prefix: string;
};

type BusinessConfigRow = {
  business_id: string;
  name: string;
  logo_symbol: string;
  headline: string;
  subheadline: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  accent_soft: string;
  rewards: Array<{ icon: string; label: string }> | string;
};

@Injectable()
export class StoreService {
  private readonly receipts = new Map<string, ReceiptRecord>();
  private readonly receiptFingerprints = new Set<string>();
  private readonly receiptImageHashes = new Set<string>();
  private readonly spins: SpinRecord[] = [];
  private readonly coupons = new Map<string, CouponRecord>();
  private readonly businessConfigs = new Map<string, BusinessConfig>([
    [
      "default-business",
      {
        id: "default-business",
        name: "Electric Speakeasy",
        logoSymbol: "ES",
        headline: "Gecenin Ritmi",
        subheadline: "Modern gastronomi deneyimi, jackpot ile tekrar gelme istegi yaratan oyunlu akis.",
        theme: {
          background: "linear-gradient(180deg, #111111 0%, #17111b 52%, #120f10 100%)",
          surface: "#1c1b1d",
          ink: "#f4e6ab",
          accent: "#ffd84e",
          accentSoft: "#d06cff"
        },
        rewards: [
          { icon: "🍸", label: "Electic Gin Fizz" },
          { icon: "🍔", label: "Artisan Burger" },
          { icon: "🎟", label: "Jackpot Kuponu" }
        ]
      }
    ]
  ]);

  private readonly rewardRulesByBusiness = new Map<string, RewardRule[]>([
    [
      "default-business",
      [
        { id: "r0", name: "Logo Jackpot", probability: 0.15, couponCodePrefix: "JACKPOT" },
        { id: "r1", name: "Free Latte", probability: 0.4, couponCodePrefix: "LATTE" },
        { id: "r2", name: "Free Suffle", probability: 0.25, couponCodePrefix: "SUFLE" },
        { id: "r3", name: "No Reward", probability: 0.2, couponCodePrefix: "LOSE" }
      ]
    ]
  ]);

  constructor(private readonly database: DatabaseService) {}

  async createReceipt(receipt: ReceiptRecord) {
    this.receipts.set(receipt.id, receipt);
    this.receiptFingerprints.add(receipt.fingerprint);
    this.receiptImageHashes.add(receipt.imageHash);

    if (this.database.isEnabled()) {
      await this.database.query(
        `INSERT INTO receipts
          (id, user_id, business_id, amount, issued_at, fingerprint, image_hash, image_data, ocr_status, ocr_summary, valid, reject_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE
         SET amount = EXCLUDED.amount,
             issued_at = EXCLUDED.issued_at,
             fingerprint = EXCLUDED.fingerprint,
             image_hash = EXCLUDED.image_hash,
             image_data = EXCLUDED.image_data,
             ocr_status = EXCLUDED.ocr_status,
             ocr_summary = EXCLUDED.ocr_summary,
             valid = EXCLUDED.valid,
             reject_reason = EXCLUDED.reject_reason`,
        [
          receipt.id,
          receipt.userId,
          receipt.businessId,
          receipt.amount,
          receipt.issuedAt,
          receipt.fingerprint,
          receipt.imageHash,
          receipt.imageData ?? null,
          receipt.ocrStatus,
          receipt.ocrSummary ?? null,
          receipt.valid,
          receipt.rejectReason ?? null
        ]
      );
    }

    return receipt;
  }

  async getReceiptById(id: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<ReceiptRow>("SELECT * FROM receipts WHERE id = $1 LIMIT 1", [id]);
      const row = result.rows[0];
      return row ? this.mapReceiptRow(row) : undefined;
    }

    return this.receipts.get(id);
  }

  async hasFingerprint(fingerprint: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<{ exists: boolean }>(
        "SELECT EXISTS(SELECT 1 FROM receipts WHERE fingerprint = $1) AS exists",
        [fingerprint]
      );
      return result.rows[0]?.exists ?? false;
    }

    return this.receiptFingerprints.has(fingerprint);
  }

  async hasImageHash(hash: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<{ exists: boolean }>(
        "SELECT EXISTS(SELECT 1 FROM receipts WHERE image_hash = $1) AS exists",
        [hash]
      );
      return result.rows[0]?.exists ?? false;
    }

    return this.receiptImageHashes.has(hash);
  }

  async getUserSpinsForDay(userId: string, dayISO: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM spins
         WHERE user_id = $1
           AND DATE(created_at AT TIME ZONE 'UTC') = $2::date`,
        [userId, dayISO]
      );
      return Number(result.rows[0]?.count ?? 0);
    }

    return this.spins.filter((spin) => spin.userId === userId && spin.createdAt.startsWith(dayISO)).length;
  }

  async addSpin(spin: SpinRecord) {
    this.spins.push(spin);

    if (this.database.isEnabled()) {
      await this.database.query(
        `INSERT INTO spins (id, user_id, business_id, receipt_id, reward_name, win, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [spin.id, spin.userId, spin.businessId, spin.receiptId, spin.rewardName, spin.win, spin.createdAt]
      );
    }
  }

  async createCoupon(coupon: CouponRecord) {
    this.coupons.set(coupon.id, coupon);

    if (this.database.isEnabled()) {
      await this.database.query(
        `INSERT INTO coupons (id, user_id, business_id, reward_name, code, redeemed_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [coupon.id, coupon.userId, coupon.businessId, coupon.rewardName, coupon.code, coupon.redeemedAt ?? null]
      );
    }

    return coupon;
  }

  async redeemCoupon(couponId: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<CouponRow>(
        `UPDATE coupons
         SET redeemed_at = NOW()
         WHERE id = $1 AND redeemed_at IS NULL
         RETURNING id, user_id, business_id, reward_name, code, redeemed_at`,
        [couponId]
      );
      const row = result.rows[0];
      return row ? this.mapCouponRow(row) : null;
    }

    const coupon = this.coupons.get(couponId);
    if (!coupon || coupon.redeemedAt) {
      return null;
    }
    coupon.redeemedAt = new Date().toISOString();
    return coupon;
  }

  async getRewardRules(businessId: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<RewardRow>(
        "SELECT id, name, probability, code_prefix FROM rewards WHERE business_id = $1 ORDER BY created_at ASC",
        [businessId]
      );
      if (result.rows.length > 0) {
        return result.rows.map((row: RewardRow) => ({
          id: row.id,
          name: row.name,
          probability: Number(row.probability),
          couponCodePrefix: row.code_prefix
        }));
      }
    }

    return this.rewardRulesByBusiness.get(businessId) ?? this.rewardRulesByBusiness.get("default-business") ?? [];
  }

  async getBusinessConfig(businessId: string) {
    if (this.database.isEnabled()) {
      const result = await this.database.query<BusinessConfigRow>(
        `SELECT bc.business_id,
                b.name,
                bc.logo_symbol,
                bc.headline,
                bc.subheadline,
                bc.background,
                bc.surface,
                bc.ink,
                bc.accent,
                bc.accent_soft,
                bc.rewards
         FROM business_configs bc
         JOIN businesses b ON b.id = bc.business_id
         WHERE bc.business_id = $1
         LIMIT 1`,
        [businessId]
      );
      const row = result.rows[0];
      if (row) {
        return this.mapBusinessConfigRow(row);
      }
    }

    return this.businessConfigs.get(businessId) ?? this.businessConfigs.get("default-business") ?? null;
  }

  async setBusinessConfig(businessId: string, config: BusinessConfig) {
    this.businessConfigs.set(businessId, config);

    if (this.database.isEnabled()) {
      await this.database.query(
        `INSERT INTO businesses (id, name)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [businessId, config.name]
      );

      await this.database.query(
        `INSERT INTO business_configs
          (business_id, logo_symbol, headline, subheadline, background, surface, ink, accent, accent_soft, rewards, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (business_id) DO UPDATE
         SET logo_symbol = EXCLUDED.logo_symbol,
             headline = EXCLUDED.headline,
             subheadline = EXCLUDED.subheadline,
             background = EXCLUDED.background,
             surface = EXCLUDED.surface,
             ink = EXCLUDED.ink,
             accent = EXCLUDED.accent,
             accent_soft = EXCLUDED.accent_soft,
             rewards = EXCLUDED.rewards,
             updated_at = NOW()`,
        [
          businessId,
          config.logoSymbol,
          config.headline,
          config.subheadline,
          config.theme.background,
          config.theme.surface,
          config.theme.ink,
          config.theme.accent,
          config.theme.accentSoft,
          JSON.stringify(config.rewards)
        ]
      );
    }

    return config;
  }

  async setRewardRules(businessId: string, rules: RewardRule[]) {
    this.rewardRulesByBusiness.set(businessId, rules);

    if (this.database.isEnabled()) {
      await this.database.query("DELETE FROM rewards WHERE business_id = $1", [businessId]);
      for (const rule of rules) {
        await this.database.query(
          "INSERT INTO rewards (id, business_id, name, probability, code_prefix) VALUES ($1,$2,$3,$4,$5)",
          [rule.id || randomUUID(), businessId, rule.name, rule.probability, rule.couponCodePrefix]
        );
      }
    }

    return rules;
  }

  async getDashboardMetrics(businessId: string) {
    if (this.database.isEnabled()) {
      const [receiptsResult, spinsResult, couponsResult, distributionResult] = await Promise.all([
        this.database.query<{ receipts_total: string; validated_total: string }>(
          `SELECT COUNT(*)::text AS receipts_total,
                  COUNT(*) FILTER (WHERE valid = true)::text AS validated_total
           FROM receipts
           WHERE business_id = $1`,
          [businessId]
        ),
        this.database.query<{ spins_total: string }>("SELECT COUNT(*)::text AS spins_total FROM spins WHERE business_id = $1", [
          businessId
        ]),
        this.database.query<{ coupons_total: string; redeemed_total: string }>(
          `SELECT COUNT(*)::text AS coupons_total,
                  COUNT(*) FILTER (WHERE redeemed_at IS NOT NULL)::text AS redeemed_total
           FROM coupons
           WHERE business_id = $1`,
          [businessId]
        ),
        this.database.query<{ reward_name: string; total: string }>(
          `SELECT reward_name, COUNT(*)::text AS total
           FROM spins
           WHERE business_id = $1
           GROUP BY reward_name`,
          [businessId]
        )
      ]);

      const receiptsTotal = Number(receiptsResult.rows[0]?.receipts_total ?? 0);
      const validatedTotal = Number(receiptsResult.rows[0]?.validated_total ?? 0);
      const spinsTotal = Number(spinsResult.rows[0]?.spins_total ?? 0);
      const couponsTotal = Number(couponsResult.rows[0]?.coupons_total ?? 0);
      const redeemedTotal = Number(couponsResult.rows[0]?.redeemed_total ?? 0);

      return {
        receipts_total: receiptsTotal,
        validation_pass_ratio: receiptsTotal ? validatedTotal / receiptsTotal : 0,
        spins_total: spinsTotal,
        redemption_rate: couponsTotal ? redeemedTotal / couponsTotal : 0,
        reward_distribution: distributionResult.rows.reduce<Record<string, number>>((acc: Record<string, number>, row: { reward_name: string; total: string }) => {
          acc[row.reward_name] = Number(row.total);
          return acc;
        }, {})
      };
    }

    const businessReceipts = [...this.receipts.values()].filter((receipt) => receipt.businessId === businessId);
    const businessSpins = this.spins.filter((spin) => spin.businessId === businessId);
    const businessCoupons = [...this.coupons.values()].filter((coupon) => coupon.businessId === businessId);
    const redeemed = businessCoupons.filter((coupon) => coupon.redeemedAt).length;
    const validated = businessReceipts.filter((receipt) => receipt.valid).length;

    return {
      receipts_total: businessReceipts.length,
      validation_pass_ratio: businessReceipts.length ? validated / businessReceipts.length : 0,
      spins_total: businessSpins.length,
      redemption_rate: businessCoupons.length ? redeemed / businessCoupons.length : 0,
      reward_distribution: businessSpins.reduce<Record<string, number>>((acc, spin) => {
        acc[spin.rewardName] = (acc[spin.rewardName] ?? 0) + 1;
        return acc;
      }, {})
    };
  }

  private mapReceiptRow(row: ReceiptRow): ReceiptRecord {
    return {
      id: row.id,
      userId: row.user_id,
      businessId: row.business_id,
      amount: Number(row.amount),
      issuedAt: row.issued_at,
      fingerprint: row.fingerprint,
      imageHash: row.image_hash,
      imageData: row.image_data ?? undefined,
      ocrStatus: row.ocr_status ?? "rejected",
      ocrSummary: row.ocr_summary ?? undefined,
      valid: row.valid,
      rejectReason: row.reject_reason ?? undefined
    };
  }

  private mapCouponRow(row: CouponRow): CouponRecord {
    return {
      id: row.id,
      userId: row.user_id,
      businessId: row.business_id,
      rewardName: row.reward_name,
      code: row.code,
      redeemedAt: row.redeemed_at ?? undefined
    };
  }

  private mapBusinessConfigRow(row: BusinessConfigRow): BusinessConfig {
    const rewards =
      typeof row.rewards === "string"
        ? (JSON.parse(row.rewards) as Array<{ icon: string; label: string }>)
        : row.rewards;

    return {
      id: row.business_id,
      name: row.name,
      logoSymbol: row.logo_symbol,
      headline: row.headline,
      subheadline: row.subheadline,
      theme: {
        background: row.background,
        surface: row.surface,
        ink: row.ink,
        accent: row.accent,
        accentSoft: row.accent_soft
      },
      rewards
    };
  }
}
