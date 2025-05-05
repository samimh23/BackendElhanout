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
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  logger: any;
  hederaApiUrl: any;
  constructor(
    // Inject the Product model
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(NormalMarket.name) private shopModel: Model<NormalMarket>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,

  )
 {
  // Get the Hedera API URL from config
  this.hederaApiUrl = this.configService.get<string>('hederaApiUrl');
}

private getCurrentTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

async create(createProductDto: CreateProductDto): Promise<Product> {
  try {
    const currentTimestamp = this.getCurrentTimestamp();
    
    const shop = await this.shopModel.findById(createProductDto.shop);
    if (!shop) {
      throw new BadRequestException('Shop not found');
    }

    const newProduct = new this.productModel({
      ...createProductDto,
      shop: shop._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedProduct = await newProduct.save();
    
    
    await this.shopModel.findByIdAndUpdate(
      shop._id,
      { $push: { products: savedProduct._id } },
      { new: true }
    );
    
    
    if (savedProduct.stock > 0) {
      try {
        console.log('Creating Hedera token for product...');
        
        const createTokenResponse = await firstValueFrom(
          this.httpService.post(`${this.hederaApiUrl}/api/tokens/create`, {
            productName: savedProduct.name,
            initialStockKg: savedProduct.stock,
            creatorAccountId: shop.marketWalletPublicKey,
            creatorPrivateKey: shop.marketWalletSecretKey,
            metadata: {
              productId: savedProduct._id.toString(),
              shopId: shop._id.toString(),
              category: savedProduct.category,
              description: savedProduct.description,
              createdAt: currentTimestamp,
            }
          }, 
          {
            timeout: 10000000 
          })
        );
        
        const tokenData = createTokenResponse.data;
        
        if (tokenData && tokenData.success && tokenData.tokenId) {
          // Update the product with the token ID
          await this.productModel.findByIdAndUpdate(
            savedProduct._id,
            { tokenid: tokenData.tokenId }
          );
          
        } else {
        }
      } catch (error) {
      }
    }
    
    return this.productModel.findById(savedProduct._id).exec();
    
  } catch (error) {
  }
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
    const existingProduct = await this.productModel.findById(id);
    
    if (!existingProduct) {
      throw new BadRequestException('Product not found.');
    }
    
    console.log('Updating product with data:', JSON.stringify(updateProductDto));
    
    if (existingProduct && existingProduct.image && 
        updateProductDto.image && 
        existingProduct.image !== updateProductDto.image &&
        !updateProductDto.image.includes('/uploads/product/default')) {
          
      try {
        const oldImagePath = path.join(process.cwd(), existingProduct.image);
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Deleted old product image: ${oldImagePath}`);
        }
      } catch (err) {
        console.error('Error deleting old image file:', err);
      }
    }
    
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
    
    if (product.image) {
      try {
        const imagePath = path.join(process.cwd(), product.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted product image: ${imagePath}`);
        }
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }
    
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
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100.');
    }
  
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new BadRequestException('Product not found.');
    }
  
    if (!product.originalPrice) {
      product.originalPrice = product.price;
    }
  
    const discountFactor = discountPercentage / 100;
    product.price = product.originalPrice - (discountFactor * product.originalPrice);
  
    product.isDiscounted = true;
    product.DiscountValue = discountPercentage;
  
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
