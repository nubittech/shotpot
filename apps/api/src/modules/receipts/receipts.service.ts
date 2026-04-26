import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import { FraudService } from "../fraud/fraud.service";
import { StoreService } from "../store/store.service";
import { ReceiptRecord } from "../store/types";
import { UploadReceiptDto } from "./dto/upload-receipt.dto";

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly store: StoreService,
    private readonly fraud: FraudService
  ) {}

  async uploadReceipt(payload: UploadReceiptDto): Promise<ReceiptRecord> {
    const dayISO = new Date().toISOString().slice(0, 10);
    const fingerprint = this.fingerprint(payload.businessName, payload.issuedAt, payload.amount);
    const duplicateFingerprint = await this.store.hasFingerprint(fingerprint);
    const duplicateImage = await this.store.hasImageHash(payload.imageHash);
    const dailySpinCount = await this.store.getUserSpinsForDay(payload.userId, dayISO);
    const ocr = this.runMockOcr(payload.imageData, payload.businessName, payload.amount);

    const validation = this.fraud.validate({
      issuedAt: payload.issuedAt,
      amount: payload.amount,
      duplicateFingerprint,
      duplicateImage,
      dailySpinCount
    });

    const valid = validation.valid && ocr.status === "accepted";
    const rejectReason = validation.reason ?? (ocr.status === "rejected" ? "ocr_rejected" : undefined);

    return this.store.createReceipt({
      id: randomUUID(),
      userId: payload.userId,
      businessId: payload.businessId,
      amount: payload.amount,
      issuedAt: payload.issuedAt,
      fingerprint,
      imageHash: payload.imageHash,
      imageData: payload.imageData,
      ocrStatus: ocr.status,
      ocrSummary: ocr.summary,
      valid,
      rejectReason
    });
  }

  async validateReceipt(receiptId: string) {
    const receipt = await this.store.getReceiptById(receiptId);
    if (!receipt) {
      return { found: false, valid: false, reason: "not_found" };
    }
    return {
      found: true,
      valid: receipt.valid,
      reason: receipt.rejectReason
    };
  }

  private fingerprint(businessName: string, issuedAt: string, amount: number) {
    const key = `${businessName.trim().toLowerCase()}|${issuedAt}|${amount.toFixed(2)}`;
    return createHash("sha256").update(key).digest("hex");
  }

  private runMockOcr(imageData: string, businessName: string, amount: number) {
    const hasImage = imageData.startsWith("data:image/");
    const looksReasonable = businessName.trim().length > 2 && amount > 0 && imageData.length > 500;

    if (!hasImage || !looksReasonable) {
      return {
        status: "rejected" as const,
        summary: "OCR could not confidently parse the receipt image."
      };
    }

    return {
      status: "accepted" as const,
      summary: `OCR extracted merchant=${businessName}, total=${amount.toFixed(2)}`
    };
  }
}
