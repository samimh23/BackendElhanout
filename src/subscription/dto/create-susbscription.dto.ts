import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/users/Schemas/Role.enum';

export class CreateSubscriptionDto {
    @IsNotEmpty()
    @IsEnum([Role.MERCHANT, Role.Farmer])
    roleSubscribed: Role;
    
    @IsOptional()
    @IsString()
    paymentIntentId?: string;
}