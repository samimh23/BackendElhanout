import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.schema';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { NormalMarket, NormalMarketSchema } from 'src/market/schema/normal-market.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: NormalMarket.name,
        schema: NormalMarketSchema,
      },

    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
