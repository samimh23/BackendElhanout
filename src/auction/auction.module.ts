// src/auction/auction.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Auction, AuctionSchema } from './schema/auction.schema';
import { AuctionService } from './auction.service';
import { AuctionGateway } from './auction.gateway';
import { AuctionController } from './auction.controller';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { Order, OrderSchema } from 'src/order/entities/order.schema';
import { OrderModule } from 'src/order/order.module';
import { FarmCrop, FarmCropSchema } from 'src/farm-crop/Schema/farm-crop.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema },{ name: User.name, schema: UserSchema}, { name: Order.name, schema: OrderSchema }, { name: FarmCrop.name, schema: FarmCropSchema }]),
    ScheduleModule.forRoot(),
    forwardRef(() => OrderModule),
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionGateway],
  exports: [AuctionService,AuctionGateway],
})
export class AuctionModule {}
