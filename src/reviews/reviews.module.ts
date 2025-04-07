import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, reviewSchema } from './schema/review.schema';
import { Product, ProductSchema } from 'src/product/entities/product.schema';
import { ReviewService } from './reviews.service';
import { ReviewController } from './reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: reviewSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService]
})
export class ReviewsModule {}
