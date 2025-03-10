import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.schema';
import { Model } from 'mongoose';
import { User } from 'src/users/Schemas/User.schema';
import { NormalMarket } from 'src/market/schema/normal-market.schema';

@Injectable()
export class ProductService {
  constructor(
    // Inject the Product model
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(NormalMarket.name) private shopModel: Model<NormalMarket>,
  ) {}
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const shop = await this.shopModel.findById(createProductDto.shop);

    if (!shop) {
      throw new Error('Shop not found');
    } 

    const newProduct = new this.productModel({
      ...createProductDto,
      shop: shop._id,
    });

    return await newProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return await this.productModel.find().exec();
  }

  async findOne(id: String): Promise<Product> {
    return await this.productModel.findById(id);
  }

  async update(
    id: String,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productModel.findByIdAndUpdate(id, updateProductDto);
  }

  async remove(id: String): Promise<String> {
    var product = await this.productModel.findById(id);
    await this.productModel.findByIdAndDelete(id);
    return ` ${product.name} has been deleted`;
  }

  async findProductsByName(name: string): Promise<Product[]> {
    const products = await this.productModel.find({
      name: new RegExp(name, 'i'),
    });
    return products;
  }

  async discountProduct(productId: string, discountPercentage: number): Promise<Product> {
    // Validate the discount percentage.
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100.');
    }
  
    // Retrieve the product by its id.
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new BadRequestException('Product not found.');
    }
  
    // If originalPrice is not set, initialize it with the current price.
    if (!product.originalPrice) {
      product.originalPrice = product.price;
    }
  
    // Calculate the new price based on the originalPrice.
    const discountFactor = discountPercentage / 100;
    product.price = product.originalPrice - (discountFactor * product.originalPrice);
  
    // Mark the product as discounted.
    product.isDiscounted = true;
    product.DiscountValue = discountPercentage;
  
    // Save and return the updated product.
    return product.save();
  }

  async removeDiscount(productId: string): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new BadRequestException('Product not found.');
    }
    product.price = product.originalPrice;
    product.isDiscounted = false;
    product.DiscountValue = 0;
    return product.save();

  }
  
  async getDiscountedProduct(): Promise<Product[]> {
    return this.productModel.find({ isDiscounted: true }).exec();
  }
  

  
}
