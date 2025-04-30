import { IsString, IsNotEmpty } from 'class-validator';

export class TransferTokensDto {
  @IsString()
  @IsNotEmpty()
  receiverAccountId: string;

  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class LockUnlockTokensDto {
  @IsString()
  @IsNotEmpty()
  amount: string;
}


export class TraceTransactionsDto {
    @IsString()
    @IsNotEmpty()
    accountId: string;
  }