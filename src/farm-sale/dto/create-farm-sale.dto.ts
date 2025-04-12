import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsString()
  farmCropId: string | Types.ObjectId;  

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantityMin: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  createdDate?: Date;  
}
