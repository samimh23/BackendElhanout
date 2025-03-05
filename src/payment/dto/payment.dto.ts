import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/users/Schemas/Role.enum';

export class CreatePaymentIntentDto {
  @IsEnum([Role.WHOLESALER, Role.Farmer])
  @IsNotEmpty()
  subscriptionType: Role;
  
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;
}