import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NormalMarket, NormalMarketSchema } from './schema/normal-market.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NormalMarket.name, schema: NormalMarketSchema },
    ]),
  ],
  controllers: [MarketController],
  providers: [MarketService],
})
export class NormalMarketModule {}
