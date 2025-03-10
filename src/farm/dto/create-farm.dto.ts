import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';

export class CreateFarmMarketDto {
  @IsString()
  FarmName: string;

  @IsString()
  FarmLocation: string;

  @IsString()
  @IsOptional()
  FarmPhone: string;

  @IsString()
  @IsOptional()
  FarmEmail: string;

  @IsString()
  @IsOptional()
  FarmImage: string;

  @IsMongoId()
  owner: string;  // Assuming owner is a MongoDB ObjectId

  @IsArray()
  @IsMongoId({ each: true })
  products: string[];

  @IsString()
  marketType: string;  // This should be 'farm' for this market type
}
