import { IsArray, IsDate, IsNumber, IsString } from "class-validator";

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

    @IsArray()
    images: string[];
    
    @IsString()
    shop: string;

    @IsString()
    buyer: string;
}
