import { IsISO8601, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class UploadReceiptDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  businessId!: string;

  @IsISO8601()
  issuedAt!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  imageHash!: string;

  @IsString()
  @IsNotEmpty()
  imageData!: string;
}
