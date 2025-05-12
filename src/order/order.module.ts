import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.schema';
import { Product, ProductSchema } from 'src/product/entities/product.schema';
import { NormalMarket, NormalMarketSchema } from 'src/market/schema/normal-market.schema';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { Sale, SaleSchema } from 'src/farm-sale/Schema/farm-sale.schema';
import { FarmCrop, FarmCropSchema } from 'src/farm-crop/Schema/farm-crop.schema';
import { Farm } from 'src/farm/entities/farm.entity';
import { FarmMarket, FarmMarketSchema } from 'src/farm/schema/farm.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: NormalMarket.name,
        schema: NormalMarketSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Sale.name,
        schema: SaleSchema,
      },
      {
        name: FarmCrop.name,
        schema: FarmCropSchema,
      },
      {
        name: FarmMarket.name,
        schema: FarmMarketSchema,
      },
    ]),
    
    AnalyticsModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
