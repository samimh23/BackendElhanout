import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";


class ProductOrderDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsNumber()
    @Min(1) 
    quantity: number;
  }

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  shop: string; 

  @IsString()
  @IsNotEmpty()
  iduser: string; 

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products: ProductOrderDto[]; 

  @IsDate()
  @IsOptional()
  dateOrder?: string; 

  @IsBoolean()
  @IsOptional()
  isconfirmed?: boolean; 
}
