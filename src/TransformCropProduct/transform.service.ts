import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { AuditStatus, FarmCrop, FarmCropDocument } from 'src/farm-crop/Schema/farm-crop.schema';
import { FarmMarket } from 'src/farm/schema/farm.schema';
import { ProductCategory } from 'src/product/entities/category.enum';
import { Product } from 'src/product/entities/product.schema';
import { User } from 'src/users/Schemas/User.schema';

@Injectable()
export class FarmCropToProductService {
  private readonly logger = new Logger(FarmCropToProductService.name);
  hederaApiUrl: any;

  constructor(
    @InjectModel(FarmCrop.name) private farmCropModel: Model<FarmCropDocument>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(FarmMarket.name) private shopModel: Model<FarmMarket>,
    @InjectModel(User.name) private userModel: Model<User>,  // Inject the User model
     private readonly configService: ConfigService,
        private readonly httpService: HttpService,
  ) {
    this.hederaApiUrl = this.configService.get<string>('hederaApiUrl');
  }

  /**
   * Transforms a confirmed FarmCrop into a Product
   * @param farmCrop The confirmed FarmCrop to transform
   * @returns The newly created Product
   */
  async transformFarmCropToProduct(farmCrop: FarmCropDocument): Promise<Product> {
    // Calculate product price based on expenses
    const totalExpenses = farmCrop.expenses.reduce((sum, expense) => sum + expense.value, 0);
    const basePrice = totalExpenses / (farmCrop.quantity || 1);
    
    // Add profit margin (20% markup as an example)
    const markup = 1.2;
    const price = basePrice * markup;

    // Create new product
    const newProduct = new this.productModel({
      name: farmCrop.productName,
      description: `Organic ${farmCrop.type} harvested on ${farmCrop.harvestedDay?.toLocaleDateString() || 'recent date'}`,
      price: price,
      originalPrice: basePrice,
      category: this.mapCropTypeToCategory(farmCrop.type),
      stock: farmCrop.quantity || 0,
      image: farmCrop.picture || farmCrop.auditProofImage,
      isActive: true,
      shop: farmCrop.farmMarketId,
      tokenid:"",
    });

    const savedProduct = await newProduct.save();

    // Get the farm market to find its owner
    const shop = await this.shopModel.findById(farmCrop.farmMarketId);
    
    if (!shop) {
      this.logger.error(`Farm market with ID ${farmCrop.farmMarketId} not found`);
      return savedProduct;
    }

    await this.shopModel.findByIdAndUpdate(
      farmCrop.farmMarketId,
      { $push: { products: savedProduct._id } },
      { new: true }
    );

    if (savedProduct.stock > 0) {
      try {
        // Get the user who owns the farm market
        const marketOwner = await this.userModel.findById(shop.owner);
        
        if (!marketOwner) {
          this.logger.error(`Owner with ID ${shop.owner} not found for farm market ${shop._id}`);
          return savedProduct;
        }

        // Check if the required properties exist
        if (!marketOwner.headerAccountId || !marketOwner.privateKey) {
          this.logger.error(`Owner ${marketOwner._id} is missing headerAccountId or privateKey`);
          return savedProduct;
        }

        console.log('Creating Hedera token for product...');
        
        // Call your existing Hedera API to create a token WITH TIMEOUT
        const createTokenResponse = await firstValueFrom(
          this.httpService.post(`${this.hederaApiUrl}/api/tokens/create`, {
            productName: savedProduct.name,
            initialStockKg: savedProduct.stock,
            creatorAccountId: marketOwner.headerAccountId,  // Use the owner's headerAccountId
            creatorPrivateKey: marketOwner.privateKey,      // Use the owner's privateKey
            metadata: {
              productId: savedProduct._id.toString(),
              shopId: farmCrop.farmMarketId.toString(),
              category: savedProduct.category,
              description: savedProduct.description,
            }
          }, 
          {
            timeout: 10000000 // 10000 seconds timeout
          })
        );
        
        // Get the token data from the response
        const tokenData = createTokenResponse.data;
        
        if (tokenData && tokenData.success && tokenData.tokenId) {
          // Update the product with the token ID
          await this.productModel.findByIdAndUpdate(
            savedProduct._id,
            { tokenid: tokenData.tokenId }
          );
        }
        
        // Return the updated product with token ID
        return this.productModel.findById(savedProduct._id).exec();
      } catch (error) {
        this.logger.error(`Error creating Hedera token: ${error.message}`);
        return savedProduct;
      }
    }
    
    return savedProduct;
  }

  /**
   * Maps crop type to product category
   * Note: You'll need to adjust this mapping based on your actual categories
   */
  private mapCropTypeToCategory(cropType: string): ProductCategory {
    // This is a simple example mapping. You should adjust this based on your actual categories
    const typeToCategory = {
      'vegetable': ProductCategory.VEGETABLES,
      'fruit': ProductCategory.FRUITS,
      // Add more mappings as needed
    };

    // Default to a general category if no specific mapping exists
    return typeToCategory[cropType.toLowerCase()] || ProductCategory.VEGETABLES;
  }

  /**
   * Process a single FarmCrop that has been confirmed
   * @param farmCropId The ID of the FarmCrop to process
   */
  async processConfirmedFarmCrop(farmCropId: string | Types.ObjectId): Promise<void> {
    const farmCrop = await this.farmCropModel.findById(farmCropId);
    
    if (!farmCrop) {
      this.logger.error(`FarmCrop with ID ${farmCropId} not found`);
      return;
    }

    if (farmCrop.auditStatus !== AuditStatus.CONFIRMED) {
      this.logger.log(`FarmCrop ${farmCropId} is not confirmed yet`);
      return;
    }

    try {
      // Check if product already exists for this farm crop
      const existingProduct = await this.productModel.findOne({ tokenid: farmCropId.toString() });
      
      if (existingProduct) {
        this.logger.log(`Product already exists for FarmCrop ${farmCropId}`);
        return;
      }

      // Transform and save as product
      const product = await this.transformFarmCropToProduct(farmCrop);
      this.logger.log(`Created product ${product._id} from FarmCrop ${farmCropId}`);
    } catch (error) {
      this.logger.error(`Error processing FarmCrop ${farmCropId}: ${error.message}`);
    }
  }

  /**
   * Process all confirmed FarmCrops that haven't been transformed yet
   * This is now a manual operation rather than a scheduled job
   */
  async processAllConfirmedFarmCrops(): Promise<number> {
    this.logger.log('Starting to process confirmed FarmCrops');
    let processedCount = 0;
    
    try {
      // Find all confirmed FarmCrops
      const confirmedFarmCrops = await this.farmCropModel.find({ 
        auditStatus: AuditStatus.CONFIRMED,
        harvestedDay: { $exists: true, $ne: null } // Ensure it has been harvested
      });
      
      this.logger.log(`Found ${confirmedFarmCrops.length} confirmed FarmCrops to process`);
      
      // Process each confirmed FarmCrop
      for (const farmCrop of confirmedFarmCrops) {
        await this.processConfirmedFarmCrop(farmCrop.id);
        processedCount++;
      }
      
      this.logger.log(`Finished processing ${processedCount} confirmed FarmCrops`);
      return processedCount;
    } catch (error) {
      this.logger.error(`Error in batch processing: ${error.message}`);
      return processedCount;
    }
  }

  /**
   * Manual trigger to process a specific FarmCrop 
   * This can be called from a controller when a FarmCrop is confirmed
   */
  async manualProcessFarmCrop(farmCropId: string): Promise<Product | null> {
    try {
      const farmCrop = await this.farmCropModel.findById(farmCropId);
      
      if (!farmCrop) {
        throw new Error(`FarmCrop with ID ${farmCropId} not found`);
      }
      
      if (farmCrop.auditStatus !== AuditStatus.CONFIRMED) {
        throw new Error(`FarmCrop ${farmCropId} is not confirmed yet`);
      }
      
      // Check if product already exists
      const existingProduct = await this.productModel.findOne({ tokenid: farmCropId });
      
      if (existingProduct) {
        return existingProduct;
      }
      
      // Transform and return the product
      return await this.transformFarmCropToProduct(farmCrop);
    } catch (error) {
      this.logger.error(`Error in manual processing: ${error.message}`);
      return null;
    }
  }
}