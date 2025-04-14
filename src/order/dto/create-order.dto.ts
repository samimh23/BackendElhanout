import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsMongoId,
  IsEnum,
} from 'class-validator';

class ProductOrderDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  stock: number;
}

export class CreateOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  normalMarket: string;

  @IsMongoId()
  @IsNotEmpty()
  user: string; // renamed from iduser

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
