import { IsArray, IsEmail, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateShopDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  phoneNumber: number;

  @IsEmail()
  email: string;

  @IsString()
  owner: string;

  @IsArray()
  @IsMongoId({ each: true }) 
  @IsOptional() 
  products?: string[];

  @IsArray()
  @IsString({ each: true }) 
  @IsOptional()
  categories?: string[];

  @IsArray()
  @IsString({ each: true }) 
  @IsOptional()
  deliveryOptions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paymentMethods?: string[];

}
