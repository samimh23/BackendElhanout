import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ArrayNotEmpty } from 'class-validator';
import { Role } from '../Schemas/Role.enum';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsArray()
    @ArrayNotEmpty()
    phonenumbers: number[];

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    cin?: number;

    @IsOptional()
    @IsString()
    profilepicture?: string;

   

    @IsOptional()
    @IsString()
    patentImage?: string;
}