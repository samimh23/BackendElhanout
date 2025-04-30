import { IsNotEmpty, IsNumber } from 'class-validator';

export class PlaceBidDto {
  @IsNotEmpty()
  bidderId: string;

  @IsNumber()
  @IsNotEmpty()
  bidAmount: number;
}