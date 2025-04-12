import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max, IsIn } from 'class-validator';

export class ShareFractionDto {
  @IsNotEmpty()
  @IsString()
  recipientAddress: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  percentage: number;
  
  @IsOptional()
  @IsString()
  @IsIn(['user', 'market'])
  recipientType?: 'user' | 'market'; // Optional field to explicitly specify recipient type
}