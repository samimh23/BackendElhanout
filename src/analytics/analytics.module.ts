import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Order, OrderSchema } from 'src/order/entities/order.schema';
import { NormalMarket, NormalMarketSchema } from 'src/market/schema/normal-market.schema';
import { Product, ProductSchema } from 'src/product/entities/product.schema';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Analytics, AnalyticsSchema } from './schema/analytics.schema';

@Module({
  imports: [
      MongooseModule.forFeature([
        { name: Analytics.name, schema: AnalyticsSchema },
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
      ]),
    ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {
  
}
