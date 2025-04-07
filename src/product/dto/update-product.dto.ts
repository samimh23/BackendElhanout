import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

// Don't extend PartialType(CreateProductDto) since we need different types
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  price?: number;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  stock?: number;

  @IsOptional()
  @IsString()
  shop?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isDiscounted?: boolean;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  DiscountValue?: number;
  
  @IsOptional()
  @IsString()
  keepExistingImages?: string;

  @IsOptional()
  @IsString()
  existingImage?: string;

  @IsOptional()
  @IsString()
  networkImage?: string;
}