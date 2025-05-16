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


import { OrderStatus } from '../entities/order.schema';

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
  normalmarket: string;

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
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsNumber()
  totalPrice: number;
}