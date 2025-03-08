// update-sale.dto.ts
import { IsEnum, IsOptional, IsNumber, IsDate, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '../Schema/farm-sale.schema';

export class UpdateSaleDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  auctionStartDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  auctionEndDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startingBid?: number;
}

