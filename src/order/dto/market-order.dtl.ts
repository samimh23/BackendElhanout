import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsMongoId,
  IsEnum,
} from 'class-validator';

export class ProductOrderDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  stock: number;
}

export class MarketOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  farmMarket: string;

  @IsMongoId()
  @IsNotEmpty()
  user: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products: ProductOrderDto[];

  @IsOptional()
  @Type(() => Date)
  dateOrder?: Date;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @IsEnum(['isProcessing', 'Delivering', 'isReceived'])
  orderStatus?: string;

  @IsNumber()
  totalPrice: number;
}