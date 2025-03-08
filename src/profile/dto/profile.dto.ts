import { IsEmail, IsString, IsOptional, IsArray, IsPhoneNumber } from 'class-validator';

export class ProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsOptional()
  phonenumbers?: number[];

  @IsString()
  @IsOptional()
  profilepicture?: string;

  @IsOptional()
  cin?: number;

  // Add any additional fields your frontend might use
  @IsString()
  @IsOptional()
  address?: string;
}

export class ProfileResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phonenumbers: number[];
  profilepicture: string;
  role: string;
  // Include any other fields that should be returned to the frontend
}