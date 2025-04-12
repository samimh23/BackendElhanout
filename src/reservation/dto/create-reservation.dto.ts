import { IsNotEmpty, IsString, IsOptional, IsDateString, IsMongoId, Min, IsInt, Matches } from 'class-validator';
import { Types } from 'mongoose';

export class CreateReservationDto {
  @IsMongoId()
  @IsNotEmpty()
  product: Types.ObjectId;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  stock: number;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsNotEmpty()
  pickupDate: Date;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  pickupTime: string;
}