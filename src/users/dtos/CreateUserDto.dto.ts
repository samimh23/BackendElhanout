import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ArrayNotEmpty, IsInt, Min, Max } from 'class-validator';
import { Role } from '../Schemas/Role.enum';


export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}


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

    @IsOptional()v
    cin?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(120)
    age?: number;

    @IsOptional()
    @IsEnum(Gender, { message: 'Gender must be either male or female' })
    gender?: Gender;

    @IsOptional()
    @IsString()
    profilepicture?: string;

   

    @IsOptional()
    @IsString()
    patentImage?: string;
}