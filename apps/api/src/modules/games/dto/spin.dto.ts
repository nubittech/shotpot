import { IsNotEmpty, IsString } from "class-validator";

export class SpinDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  businessId!: string;

  @IsString()
  @IsNotEmpty()
  receiptId!: string;
}
