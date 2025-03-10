import { IsString, IsNumber, Min, Max } from 'class-validator';

export class ShareFractionDto {
  @IsString()
  recipientAddress: string;  // Recipient's public key
  
  @IsNumber()
  @Min(0.01)
  @Max(100)
  percentage: number;        // Percentage to share (0-100)
}