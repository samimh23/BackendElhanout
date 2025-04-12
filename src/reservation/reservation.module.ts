import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';import { Reservation, ReservationSchema } from './schema/reservation.schema';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { Product, ProductSchema } from 'src/product/entities/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Product.name, schema: ProductSchema },
    ]),// To have access to the Product model
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}