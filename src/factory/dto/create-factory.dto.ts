import { IsString, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateFactoryDto {
  @IsString()
  FactoryName: string;

  @IsString()
  @IsOptional()
  FactoryLocation: string;

  @IsString()
  @IsOptional()
  FactoryPhone: string;

  @IsString()
  @IsOptional()
  FactoryEmail: string;

  @IsString()
  @IsOptional()
  FactoryImage: string;

  @IsMongoId()
  owner: string;  // Assuming owner is a MongoDB ObjectId

  @IsArray()
  @IsMongoId({ each: true })
  products: string[];

  @IsString()
  marketType: string; // Ensure this matches with your schema
}
