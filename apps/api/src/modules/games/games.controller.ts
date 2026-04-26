import { Body, Controller, Post } from "@nestjs/common";
import { SpinDto } from "./dto/spin.dto";
import { GamesService } from "./games.service";

@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post("spin")
  async spin(@Body() dto: SpinDto) {
    return this.gamesService.spin(dto);
  }

  @Post("scratch/reveal")
  async scratchReveal(@Body() dto: SpinDto) {
    return this.gamesService.revealScratch(dto);
  }
}
