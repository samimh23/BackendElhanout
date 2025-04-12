import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['pending', 'completed', 'cancelled'], { message: 'Status must be pending, completed, or cancelled' })
  status: string;
}