import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NormalMarket, NormalMarketSchema } from './schema/normal-market.schema';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { ShareSaleListing, ShareSaleListingSchema } from './Schema/ShareSaleListing.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule, 
    MongooseModule.forFeature([
      { name: NormalMarket.name, schema: NormalMarketSchema },
      {name: User.name, schema: UserSchema},
      {name: ShareSaleListing.name, schema: ShareSaleListingSchema},
    ]),
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService]
})
export class NormalMarketModule {}
