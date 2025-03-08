import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsDate, IsString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleType, SaleStatus } from '../Schema/farm-sale.schema';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsString()
  farmCropId: string;

  @IsNotEmpty()
  @IsEnum(SaleType)
  type: SaleType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @IsOptional()
  @IsString()
  notes?: string;


   // Auction specific fields
   @ValidateIf(o => o.type === SaleType.AUCTION)
   @IsNotEmpty()
   @Type(() => Date)
   @IsDate()
   auctionStartDate?: Date;
 
   @ValidateIf(o => o.type === SaleType.AUCTION)
   @IsNotEmpty()
   @Type(() => Date)
   @IsDate()
   auctionEndDate?: Date;
 
   @ValidateIf(o => o.type === SaleType.AUCTION)
   @IsNotEmpty()
   @IsNumber()
   @Min(0)
   startingBid?: number;
 }

 // create-bid.dto.ts


export class CreateBidDto {
  @IsString()
  bidderName: string;

  @IsOptional()
  @IsString()
  bidderContact?: string;

  @IsNumber()
  @Min(0)
  amount: number;
}


export class CompleteSaleDto {
  @IsString()
  buyerName: string;

  @IsOptional()
  @IsString()
  buyerContact?: string;
}