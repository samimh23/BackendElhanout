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

  @IsString()
  owner: string;  

  @IsArray()
  @IsOptional()
  sales: string[];

  @IsString()
  @IsOptional()
  rate?: string;

  @IsArray()
  @IsOptional()
  crops: string[];
 
}
