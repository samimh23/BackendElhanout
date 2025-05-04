import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsDate, IsEnum, IsOptional } from 'class-validator';

export class CreateAuctionDto {
  @IsNotEmpty()
  cropId: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
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