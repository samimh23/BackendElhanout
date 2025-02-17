import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';

export class CreateMarketDto {
  @IsString()
  marketName: string;

  @IsString()
  marketLocation: string;

  @IsString()
  @IsOptional()
  marketPhone: string;

  @IsString()
  @IsOptional()
  marketEmail: string;

  @IsString()
  @IsOptional()
  marketImage: string;

  @IsMongoId()
  owner: string;  

  @IsArray()
  @IsMongoId({ each: true })
  products: string[];

  @IsString()
  marketType: string;  
}
