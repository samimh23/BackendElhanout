// src/auction/auction.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Auction, AuctionSchema } from './schema/auction.schema';
import { AuctionService } from './auction.service';
import { AuctionGateway } from './auction.gateway';
import { AuctionController } from './auction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema }]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionGateway],
  exports: [AuctionService],
})
export class AuctionModule {}
