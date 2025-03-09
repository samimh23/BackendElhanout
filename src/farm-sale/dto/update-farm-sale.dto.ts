import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateSaleDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantityMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
