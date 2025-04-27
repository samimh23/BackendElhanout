import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { HederaService } from './hedera.service';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { LockUnlockTokensDto, TraceTransactionsDto, TransferTokensDto } from './hedera.dto';

@Controller('hedera')
@UseGuards(AuthenticationGuard)  // Apply authentication to all routes
export class HederaController {
  constructor(private readonly hederaService: HederaService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return this.hederaService.getBalance(req.user.id);
  }

  @Post('transfer')
  async transferTokens(
    @Request() req,
    @Body() transferTokensDto: TransferTokensDto
  ) {
    return this.hederaService.transferTokens(
      req.user.id,
      transferTokensDto.receiverAccountId,
      transferTokensDto.amount
    );
  }

  @Post('lock')
  async lockTokens(
    @Request() req,
    @Body() lockTokensDto: LockUnlockTokensDto
  ) {
    return this.hederaService.lockTokens(
      req.user.id,
      lockTokensDto.amount
    );
  }

  @Post('unlock')
  async unlockTokens(
    @Request() req,
    @Body() unlockTokensDto: LockUnlockTokensDto
  ) {
    return this.hederaService.unlockTokens(
      req.user.id,
      unlockTokensDto.amount
    );
  }

  // This endpoint should probably be restricted to admins only
  @Post('create-wallet')
  async createWallet() {
    return this.hederaService.createWallet();
  }

  @Post('trace')
  async traceTransactions(@Body() traceDto: TraceTransactionsDto) {
    return this.hederaService.traceTransactions(traceDto.accountId);
  }
  
  // Alternative version that uses the logged-in user's account
  @Get('trace/my-transactions')
  async traceMyTransactions(@Request() req) {
    return this.hederaService.traceUserTransactions(req.user.id);
  }
}