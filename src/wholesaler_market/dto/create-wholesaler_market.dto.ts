import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';

export class CreateWholesalerMarketDto {
  @IsString()
  WholesalerName: string;

  @IsString()
  WholesalerLocation: string;

  @IsString()
  @IsOptional()
  WholesalerPhone: string;

  @IsString()
  @IsOptional()
  WholesalerEmail: string;

  @IsString()
  @IsOptional()
  WholesalerImage: string;

  @IsMongoId()
  owner: string;  // Assuming owner is a MongoDB ObjectId

  @IsArray()
  @IsMongoId({ each: true })
  products: string[];

  @IsString()
  marketType: string;  // This should be 'wholesaler' for this specific market type
}
