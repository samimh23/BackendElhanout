import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Role } from "../Schemas/Role.enum";

export class BaseuserDto  {
    
    @IsString()
    name: string;
    
    @IsEmail()
    email: string;
    
    @IsString()
    password: string;
    
    @IsInt()
    age: number;
    
    @IsOptional()
    @IsInt()
    cin: string;

    @IsString()
    adresse: string;
    
    @IsInt()
    phoneNumbers: number[];
    
    @IsOptional()
    @IsString()
    profilePicture?: string;
    
    @IsEnum(Role)
    role: Role;

    @IsString()
    @IsOptional()
    patentimage?:string
}