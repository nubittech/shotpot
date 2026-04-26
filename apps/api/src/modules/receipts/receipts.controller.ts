import { Body, Controller, Param, Post } from "@nestjs/common";
import { UploadReceiptDto } from "./dto/upload-receipt.dto";
import { ReceiptsService } from "./receipts.service";

@Controller("receipts")
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post("upload")
  async upload(@Body() dto: UploadReceiptDto) {
    return this.receiptsService.uploadReceipt(dto);
  }

  @Post(":id/validate")
  async validate(@Param("id") id: string) {
    return this.receiptsService.validateReceipt(id);
  }
}
