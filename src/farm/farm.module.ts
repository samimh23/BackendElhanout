import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmController } from './farm.controller';
import { FarmService } from './farm.service';
import { FarmMarket, FarmMarketSchema } from './schema/farm.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FarmMarket.name, schema: FarmMarketSchema }
    ]),
    ConfigModule,
  ],
  controllers: [FarmController],
  providers: [FarmService],
})
export class FarmModule {}
