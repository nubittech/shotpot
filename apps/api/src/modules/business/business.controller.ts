import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsArray, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { StoreService } from "../store/store.service";

class RewardRuleInput {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  probability!: number;

  @IsString()
  @IsNotEmpty()
  couponCodePrefix!: string;
}

class RewardRuleUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardRuleInput)
  rules!: RewardRuleInput[];
}

class RewardVisualInput {
  @IsString()
  @IsNotEmpty()
  icon!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

class ConfigUpdateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  logoSymbol!: string;

  @IsString()
  @IsNotEmpty()
  headline!: string;

  @IsString()
  @IsNotEmpty()
  subheadline!: string;

  @IsString()
  @IsNotEmpty()
  background!: string;

  @IsString()
  @IsNotEmpty()
  surface!: string;

  @IsString()
  @IsNotEmpty()
  ink!: string;

  @IsString()
  @IsNotEmpty()
  accent!: string;

  @IsString()
  @IsNotEmpty()
  accentSoft!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardVisualInput)
  rewards!: RewardVisualInput[];
}

@Controller("business")
export class BusinessController {
  constructor(private readonly store: StoreService) {}

  @Get(":id/dashboard/metrics")
  async metrics(@Param("id") id: string) {
    return this.store.getDashboardMetrics(id);
  }

  @Get(":id/config")
  async config(@Param("id") id: string) {
    return this.store.getBusinessConfig(id);
  }

  @Get(":id/reward-rules")
  async rewardRules(@Param("id") id: string) {
    return this.store.getRewardRules(id);
  }

  @Post(":id/config")
  async updateConfig(@Param("id") id: string, @Body() body: ConfigUpdateDto) {
    return this.store.setBusinessConfig(id, {
      id,
      name: body.name,
      logoSymbol: body.logoSymbol,
      headline: body.headline,
      subheadline: body.subheadline,
      theme: {
        background: body.background,
        surface: body.surface,
        ink: body.ink,
        accent: body.accent,
        accentSoft: body.accentSoft
      },
      rewards: body.rewards
    });
  }

  @Post(":id/reward-rules")
  async setRewardRules(@Param("id") id: string, @Body() body: RewardRuleUpdateDto) {
    const rules = body.rules.map((rule, index) => ({
      id: `rule-${index + 1}`,
      name: rule.name,
      probability: rule.probability,
      couponCodePrefix: rule.couponCodePrefix
    }));
    const total = rules.reduce((sum, rule) => sum + rule.probability, 0);
    if (Math.abs(1 - total) > 0.0001) {
      return { updated: false, reason: "probabilities_must_sum_to_1" };
    }
    return { updated: true, rules: await this.store.setRewardRules(id, rules) };
  }
}
