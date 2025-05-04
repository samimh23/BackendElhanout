import { Module } from '@nestjs/common';
import { HederaService } from './hedera.service';
import { HederaController } from './hedera.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/Schemas/User.schema';
import { NormalMarket, NormalMarketSchema } from 'src/market/schema/normal-market.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: NormalMarket.name, schema: NormalMarketSchema }]),
  ],
  controllers: [HederaController],
  providers: [HederaService],
  exports: [HederaService],
})
export class HederaModule {}