import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAuctionDto {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsString()
  farmerId: string;

  @IsNumber()
  @IsNotEmpty()
  startingPrice: number;

  @IsDate()
  @Type(() => Date) // Converts string to Date
  @IsNotEmpty()
  startTime: Date;

  @IsDate()
  @Type(() => Date) // Converts string to Date
  @IsNotEmpty()
  endTime: Date;

  @IsOptional()
  @IsEnum(['active', 'completed', 'cancelled'], { message: 'Invalid status' })
  status?: 'active' | 'completed' | 'cancelled';
}