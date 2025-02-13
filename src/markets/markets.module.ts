import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketService } from './markets.service';
import { MarketController } from './markets.controller';
import { Market, MarketSchema } from './schemas/market.schema';
import { FactoryMarket, FactoryMarketSchema } from './schemas/factory.schema';
import { FarmMarket, FarmMarketSchema } from './schemas/farm.schema';
import { GroceryMarket, GroceryMarketSchema } from './schemas/grocery.schema';
import { NormalMarket, NormalMarketSchema } from './schemas/normal-market.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Market.name, schema: MarketSchema },
      { name: FactoryMarket.name, schema: FactoryMarketSchema },
      { name: FarmMarket.name, schema: FarmMarketSchema },
      { name: GroceryMarket.name, schema: GroceryMarketSchema },
      { name: NormalMarket.name, schema: NormalMarketSchema },
    ]),
  ],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
