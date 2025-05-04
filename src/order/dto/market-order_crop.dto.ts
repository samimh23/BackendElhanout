import { IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';
import { Types } from 'mongoose';

export class MarketOrderCropDto {
  @IsMongoId()
  saleId: string | Types.ObjectId;

  @IsMongoId()
  marketId: string | Types.ObjectId;

  @IsNumber()
  @Min(1)
  quantity: number

  @IsOptional()
  @IsNumber()
  pricePerUnit?: number;
}