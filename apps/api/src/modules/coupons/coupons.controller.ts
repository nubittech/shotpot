import { BadRequestException, Controller, Param, Post } from "@nestjs/common";
import { StoreService } from "../store/store.service";

@Controller("coupons")
export class CouponsController {
  constructor(private readonly store: StoreService) {}

  @Post(":id/redeem")
  async redeem(@Param("id") id: string) {
    const redeemed = await this.store.redeemCoupon(id);
    if (!redeemed) {
      throw new BadRequestException("coupon_not_found_or_redeemed");
    }
    return redeemed;
  }
}
