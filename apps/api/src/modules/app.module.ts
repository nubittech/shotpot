import { Module } from "@nestjs/common";
import { BusinessController } from "./business/business.controller";
import { CouponsController } from "./coupons/coupons.controller";
import { DatabaseService } from "./db/database.service";
import { FraudService } from "./fraud/fraud.service";
import { GamesController } from "./games/games.controller";
import { GamesService } from "./games/games.service";
import { HealthController } from "./health/health.controller";
import { ReceiptsController } from "./receipts/receipts.controller";
import { ReceiptsService } from "./receipts/receipts.service";
import { StoreService } from "./store/store.service";

@Module({
  imports: [],
  controllers: [
    HealthController,
    ReceiptsController,
    GamesController,
    CouponsController,
    BusinessController
  ],
  providers: [DatabaseService, StoreService, FraudService, ReceiptsService, GamesService]
})
export class AppModule {}
