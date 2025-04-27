import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';

export class CreateFarmMarketDto {
  @IsString()
  farmName: string;

  @IsString()
  farmLocation: string;

  @IsString()
  @IsOptional()
  farmPhone: string;

  @IsString()
  @IsOptional()
  farmEmail: string;

  @IsString()
  @IsOptional()
  farmImage: string;

  @IsString()
  @IsOptional()
  farmDescription: string;


  @IsMongoId()
  owner: string;  // Assuming owner is a MongoDB ObjectId

  @IsArray()
  @IsMongoId({ each: true })
  sales: string[];

  @IsString()
  marketType: string;  // This should be 'farm' for this market type
}
