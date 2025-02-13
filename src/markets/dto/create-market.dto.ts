import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { MarketType } from '../schemas/market.schema';

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty()
  marketName: string;

  @IsString()
  @IsNotEmpty()
  marketLocation: string;

  @IsString()
  @IsNotEmpty()
  marketOwner: string;

  @IsString()
  @IsOptional()
  marketPhone: string;

  @IsString()
  @IsOptional()
  marketEmail: string;

  @IsString()
  @IsOptional()
  marketImage: string;

  @IsEnum(MarketType)
  marketType: MarketType;
  

  @IsOptional()
  products?: string[];
}
