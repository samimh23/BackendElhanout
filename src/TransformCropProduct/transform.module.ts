import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmCrop, FarmCropSchema } from 'src/farm-crop/Schema/farm-crop.schema';
import { Product, ProductSchema } from 'src/product/entities/product.schema';
import { FarmCropToProductService } from './transform.service';
import { FarmCropToProductController } from './transform.controller';
import { config } from 'dotenv';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios'; // Add this if you use HttpService
import { FarmMarket, FarmMarketSchema } from 'src/farm/schema/farm.schema';
import { User, UserSchema } from 'src/users/Schemas/User.schema';

@Module({
  imports: [
    ConfigModule,
    HttpModule, // Add this if your service uses HttpService
    MongooseModule.forFeature([
      { name: FarmCrop.name, schema: FarmCropSchema },
      { name: Product.name, schema: ProductSchema },
      { name: FarmMarket.name, schema: FarmMarketSchema }, 
      { name: User.name, schema: UserSchema }, // Assuming you have a User schema
    ]),
  ],
  controllers: [FarmCropToProductController],
  providers: [FarmCropToProductService],
  exports: [FarmCropToProductService],
})
export class FarmCropToProductModule {}