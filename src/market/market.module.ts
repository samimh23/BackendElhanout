import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios'; // Add this import
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NormalMarket, NormalMarketSchema } from './schema/normal-market.schema';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { ConfigModule } from '@nestjs/config';

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