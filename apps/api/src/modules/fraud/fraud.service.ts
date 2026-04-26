import { Injectable } from "@nestjs/common";

type FraudCheckInput = {
  issuedAt: string;
  amount: number;
  duplicateFingerprint: boolean;
  duplicateImage: boolean;
  dailySpinCount: number;
};

@Injectable()
export class FraudService {
  private readonly windowMinutes = Number(process.env.RECEIPT_WINDOW_MINUTES ?? 120);
  private readonly minAmount = Number(process.env.MIN_RECEIPT_AMOUNT ?? 100);
  private readonly dailyPlayLimit = Number(process.env.DAILY_PLAY_LIMIT ?? 2);

  validate(input: FraudCheckInput): { valid: boolean; reason?: string } {
    const issuedAt = new Date(input.issuedAt);
    const now = new Date();
    const windowMs = this.windowMinutes * 60 * 1000;

    if (Number.isNaN(issuedAt.getTime())) {
      return { valid: false, reason: "invalid_date" };
    }
    if (now.getTime() - issuedAt.getTime() > windowMs) {
      return { valid: false, reason: "receipt_too_old" };
    }
    if (input.amount < this.minAmount) {
      return { valid: false, reason: "below_min_amount" };
    }
    if (input.duplicateFingerprint) {
      return { valid: false, reason: "duplicate_receipt_fingerprint" };
    }
    if (input.duplicateImage) {
      return { valid: false, reason: "duplicate_receipt_image" };
    }
    if (input.dailySpinCount >= this.dailyPlayLimit) {
      return { valid: false, reason: "daily_limit_exceeded" };
    }

    return { valid: true };
  }
}
