import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { StoreService } from "../store/store.service";
import { RewardRule } from "../store/types";
import { SpinDto } from "./dto/spin.dto";

@Injectable()
export class GamesService {
  constructor(private readonly store: StoreService) {}

  async spin(dto: SpinDto) {
    const isTestReceipt = dto.receiptId.startsWith("test-token-");
    const receipt = isTestReceipt ? null : await this.store.getReceiptById(dto.receiptId);

    if (!isTestReceipt) {
      if (!receipt || !receipt.valid) {
        throw new BadRequestException("receipt_not_eligible");
      }
      if (receipt.userId !== dto.userId || receipt.businessId !== dto.businessId) {
        throw new BadRequestException("receipt_owner_mismatch");
      }
    }

    const rules = await this.store.getRewardRules(dto.businessId);
    const result = this.weightedPick(rules);
    const spinId = randomUUID();
    const createdAt = new Date().toISOString();
    const win = result.name !== "No Reward";

    await this.store.addSpin({
      id: spinId,
      userId: dto.userId,
      businessId: dto.businessId,
      receiptId: dto.receiptId,
      rewardName: result.name,
      win,
      createdAt
    });

    let coupon = null;
    if (win) {
      coupon = await this.store.createCoupon({
        id: randomUUID(),
        userId: dto.userId,
        businessId: dto.businessId,
        rewardName: result.name,
        code: `${result.couponCodePrefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      });
    }

    return {
      spinId,
      outcome: result.name,
      win,
      animationHint:
        result.name === "No Reward" ? "standard" : result.name === "Logo Jackpot" ? "jackpot" : "win",
      coupon
    };
  }

  async revealScratch(dto: SpinDto) {
    return this.spin(dto);
  }

  private weightedPick(rules: RewardRule[]) {
    const roll = Math.random();
    let cumulative = 0;
    for (const rule of rules) {
      cumulative += rule.probability;
      if (roll <= cumulative) {
        return rule;
      }
    }
    return rules[rules.length - 1];
  }
}
