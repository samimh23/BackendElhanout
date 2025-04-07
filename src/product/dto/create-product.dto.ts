import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

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
    image: string; // Changed from images array to single image
    
    @IsString()
    shop: string;
}