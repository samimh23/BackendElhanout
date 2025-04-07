import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NormalMarket, NormalMarketSchema } from './schema/normal-market.schema';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { User, UserSchema } from 'src/users/Schemas/User.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule, // Add HttpModule here
    MongooseModule.forFeature([
      { name: NormalMarket.name, schema: NormalMarketSchema },
      {name: User.name, schema: UserSchema}
    ]),
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService]
})
export class NormalMarketModule {}
