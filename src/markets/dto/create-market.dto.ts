import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { MarketType } from '../schemas/market.schema';

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty()
  readonly Owner: string;

  @IsOptional()
  readonly products?: string[];

  @IsEnum(MarketType)
  readonly marketType: MarketType;

  @IsString()
  @IsOptional()
  readonly FactoryName?: string;

  @IsString()
  @IsOptional()
  readonly FactoryLocation?: string;

  @IsString()
  @IsOptional()
  readonly FactoryPhone?: string;

  @IsString()
  @IsOptional()
  readonly FactoryEmail?: string;

  @IsString()
  @IsOptional()
  readonly FactoryImage?: string;

  @IsString()
  @IsOptional()
  readonly GroceryName?: string;

  @IsString()
  @IsOptional()
  readonly GroceryLocation?: string;

  @IsString()
  @IsOptional()
  readonly GroceryPhone?: string;

  @IsString()
  @IsOptional()
  readonly GroceryEmail?: string;

  @IsString()
  @IsOptional()
  readonly GroceryImage?: string;

  @IsString()
  @IsOptional()
  readonly marketName?: string;

  @IsString()
  @IsOptional()
  readonly marketLocation?: string;

  @IsString()
  @IsOptional()
  readonly marketPhone?: string;

  @IsString()
  @IsOptional()
  readonly marketEmail?: string;

  @IsString()
  @IsOptional()
  readonly marketImage?: string;
}
