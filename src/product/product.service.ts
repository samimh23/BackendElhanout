import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.schema';
import { Model } from 'mongoose';
import { User } from 'src/users/Schemas/User.schema';
import { NormalMarket } from 'src/market/schema/normal-market.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductService {
  constructor(
    // Inject the Product model
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(NormalMarket.name) private shopModel: Model<NormalMarket>,
  ) {}
  
  async create(createProductDto: CreateProductDto): Promise<Product> {
    console.log('Creating product with shop ID:', createProductDto.shop);
    
    const shop = await this.shopModel.findById(createProductDto.shop);

    if (!shop) {
      throw new Error('Shop not found');
    } 

    const newProduct = new this.productModel({
      ...createProductDto,
      shop: shop._id,
    });
    
    // Save the product first to get its ID
    const savedProduct = await newProduct.save();
    console.log('Product saved with ID:', savedProduct._id);
    
    // Update the shop's products array with the new product ID
    await this.shopModel.findByIdAndUpdate(
      shop._id,
      { $push: { products: savedProduct._id } },
      { new: true } // Return the updated document
    );
    
    console.log('Updated shop products list');
    
    return savedProduct;
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
    // Get the existing product to check if we need to delete old image
    const existingProduct = await this.productModel.findById(id);
    
    if (!existingProduct) {
      throw new BadRequestException('Product not found.');
    }
    
    console.log('Updating product with data:', JSON.stringify(updateProductDto));
    
    // If the image has changed and the old one exists, delete it
    if (existingProduct && existingProduct.image && 
        updateProductDto.image && 
        existingProduct.image !== updateProductDto.image &&
        !updateProductDto.image.includes('/uploads/product/default')) {
          
      try {
        // Get the full path to the old image
        const oldImagePath = path.join(process.cwd(), existingProduct.image);
        
        // Check if file exists before trying to delete
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Deleted old product image: ${oldImagePath}`);
        }
      } catch (err) {
        console.error('Error deleting old image file:', err);
        // Continue anyway - this is not critical
      }
    }
    
    // Only update fields that are present in the update object
    const updateOperation = {};
    
    Object.keys(updateProductDto).forEach(key => {
      if (updateProductDto[key] !== undefined) {
        updateOperation[key] = updateProductDto[key];
      }
    });
    
    console.log('Final update operation:', JSON.stringify(updateOperation));
    
    return this.productModel.findByIdAndUpdate(id, updateOperation, { new: true });
  }

  async remove(id: String): Promise<String> {
    const product = await this.productModel.findById(id);
    
    if (!product) {
      throw new BadRequestException('Product not found.');
    }
    
    // Try to delete the product image if it exists
    if (product.image) {
      try {
        const imagePath = path.join(process.cwd(), product.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted product image: ${imagePath}`);
        }
      } catch (err) {
        console.error('Error deleting image file:', err);
        // Continue anyway - this is not critical
      }
    }
    
    // Remove the product ID from the shop's products array
    if (product.shop) {
      await this.shopModel.findByIdAndUpdate(
        product.shop,
        { $pull: { products: id } },
        { new: true }
      );
      console.log(`Removed product ${id} from shop ${product.shop}'s product list`);
    }
    
    await this.productModel.findByIdAndDelete(id);
    return `${product.name} has been deleted`;
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
