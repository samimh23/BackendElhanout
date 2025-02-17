import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmController } from './farm.controller';
import { FarmService } from './farm.service';
import { FarmMarket, FarmMarketSchema } from './schema/farm.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FarmMarket.name, schema: FarmMarketSchema },
    ]),
  ],
  controllers: [FarmController],
  providers: [FarmService],
})
export class FarmModule {}
