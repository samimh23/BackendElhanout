import { IsArray, IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    originalPrice: number;
    @IsString()
    category: string;

    @IsNumber()
    stock: number;

    @IsString()
    @IsOptional()
    image: string; 
    
    @IsString()
    shop: string;


}
