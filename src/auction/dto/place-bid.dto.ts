import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class PlaceBidDto {
  @IsNotEmpty()
  bidderId: string;

  @IsNumber()
  @IsNotEmpty()
  bidAmount: number;

  @IsDate()
    @Type(() => Date) // Converts string to Date
    @IsNotEmpty()
    bidTime: Date;
}