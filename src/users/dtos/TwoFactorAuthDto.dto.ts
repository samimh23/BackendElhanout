import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorAuthDto {
  @IsNotEmpty()
  @IsString()
  twoFactorCode: string;
}

export class TwoFactorEnableDto {
  @IsNotEmpty()
  @IsString()
  twoFactorCode: string;
}

export class TwoFactorAuthResultDto {
  accessToken: string;
  refreshToken: string;
}