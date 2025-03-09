import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from './Schema/farm-sale.schema';
import { FarmCrop, FarmCropSchema } from 'src/farm-crop/Schema/farm-crop.schema';
import { FarmSaleController } from './farm-sale.controller';
import { FarmSaleService } from './farm-sale.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: FarmCrop.name, schema: FarmCropSchema },
    ]),
   // ScheduleModule.forRoot(),
   ConfigModule,
  ],
  controllers: [FarmSaleController],
  providers: [FarmSaleService],
  exports: [FarmSaleService],
})
export class FarmSaleModule {}
