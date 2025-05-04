import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schema/review.schema';
import { Product } from 'src/product/entities/product.schema';

interface newUpdateReviewDto extends UpdateReviewDto {
  user: string;
}

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModule: Model<Review>,
    @InjectModel(Product.name) private readonly productModule: Model<Product>,
  ) {}
  async create(createReviewDto: CreateReviewDto, user_id: string) {
    // Check if the user has already reviewed this product
    let review = await this.reviewModule.findOne({
      user: user_id,
      product: createReviewDto.product,
    });
  
    if (review) {
      // Update the existing review
      review = await this.reviewModule.findByIdAndUpdate(
        review._id,
        { ...createReviewDto },
        { new: true }
      ).populate('product user', 'name email title description imageCover');
    } else {
      // Create a new review
      review = await (
        await this.reviewModule.create({
          ...createReviewDto,
          user: user_id,
        })
      ).populate('product user', 'name email title description imageCover');
    }
  
    // Recalculate the ratings for the product
    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: createReviewDto.product,
      })
      .select('rating');
    const ratingsQuantity = reviewsOnSingleProduct.length;
  
    if (ratingsQuantity > 0) {
      const totalRatings = reviewsOnSingleProduct.reduce(
        (sum, r) => sum + r.rating,
        0
      );
      const ratingsAverage = totalRatings / ratingsQuantity;
  
      await this.productModule.findByIdAndUpdate(createReviewDto.product, {
        ratingsAverage,
        ratingsQuantity,
      });
    }
  
    return {
      status: 200,
      message: 'Review created or updated successfully',
      data: review,
    };
  }

  async findAll(prodcut_id: string) {
    const review = await this.reviewModule
      .find({ product: prodcut_id })
      .populate('user product', 'name email title')
      .select('-__v');
    return {
      status: 200,
      message: 'Reviews Found',
      length: review.length,
      data: review,
    };
  }

  async findOne(user_id: string) {
    const review = await this.reviewModule
      .find({ user: user_id })
      .populate('user product', 'name role email title')
      .select('-__v');
    return {
      status: 200,
      message: 'Reviews Found',
      length: review.length,
      data: review,
    };
  }

  async update(
    id: string,
    updateReviewDto: newUpdateReviewDto,
    user_id: string,
  ) {
    const findReview = await this.reviewModule.findById(id);

    if (!findReview) {
      throw new NotFoundException('Not Found Review On this Id');
    }

    if (user_id.toString() !== findReview.user.toString()) {
      throw new UnauthorizedException();
    }

    const updateReview = await this.reviewModule
      .findByIdAndUpdate(
        id,
        {
          ...updateReviewDto,
          user: user_id,
          product: updateReviewDto.product,
        },
        { new: true },
      )
      .select('-__v');
    // Rating in product module

    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: findReview.product,
      })
      .select('rating');
    const ratingsQuantity = reviewsOnSingleProduct.length;

    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;
      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage,
        ratingsQuantity,
      });
    }

    return {
      status: 200,
      message: 'Review Updated successfully',
      data: updateReview,
    };
  }

  async remove(id: string, user_id: string): Promise<void> {
    const findReview = await this.reviewModule.findById(id);

    if (!findReview) {
      throw new NotFoundException('Not Found Review On this Id');
    }
    if (user_id.toString() !== findReview.user.toString()) {
      throw new UnauthorizedException();
    }
    await this.reviewModule.findByIdAndDelete(id);
    // Rating in product module
    // Rating in product module

    const reviewsOnSingleProduct = await this.reviewModule
      .find({
        product: findReview.product,
      })
      .select('rating');
    const ratingsQuantity = reviewsOnSingleProduct.length;
    if (ratingsQuantity > 0) {
      let totalRatings: number = 0;
      for (let i = 0; i < reviewsOnSingleProduct.length; i++) {
        totalRatings += reviewsOnSingleProduct[i].rating;
      }
      const ratingsAverage = totalRatings / ratingsQuantity;

      await this.productModule.findByIdAndUpdate(findReview.product, {
        ratingsAverage,
        ratingsQuantity,
      });
    }
  }
  async getReviewsByUserId(user_id: string) {
  
    const reviews = await this.reviewModule
      .find({ user: user_id });
  // Log the number of reviews found
  
    return {
      status: 200,
      message: 'Reviews Found',
      length: reviews.length,
      data: reviews,
    };
  }
}