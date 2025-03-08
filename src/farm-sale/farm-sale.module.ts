import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from './Schema/farm-sale.schema';
import { FarmCrop, FarmCropSchema } from 'src/farm-crop/Schema/farm-crop.schema';
import { Bid, BidSchema } from './Schema/bid.schema';
import { FarmSaleController } from './farm-sale.controller';
import { FarmSaleService } from './farm-sale.service';
import { AuctionCronService } from './auction-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: FarmCrop.name, schema: FarmCropSchema },
      { name: Bid.name, schema: BidSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [FarmSaleController],
  providers: [FarmSaleService, AuctionCronService],
  exports: [FarmSaleService],
})
export class FarmSaleModule {}
