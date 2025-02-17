import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WholesalerMarketController } from './wholesaler_market.controller';
import { WholesalerMarketService } from './wholesaler_market.service';
import { WholesalerMarket, wholesalerMarketSchema } from './schema/wholesaler_market.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WholesalerMarket.name, schema: wholesalerMarketSchema },
    ]),
  ],
  controllers: [WholesalerMarketController],
  providers: [WholesalerMarketService],
})
export class WholesalerMarketModule {}
