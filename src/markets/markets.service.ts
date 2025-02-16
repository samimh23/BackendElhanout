import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Market, MarketDocument, MarketType } from './schemas/market.schema';
import { FactoryMarket } from './schemas/factory.schema';
import { FarmMarket } from './schemas/farm.schema';
import { GroceryMarket } from './schemas/grocery.schema';
import { NormalMarket } from './schemas/normal-market.schema';
import { CreateMarketDto } from './dto/create-market.dto';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name); // Logger instance

  constructor(
    @InjectModel(Market.name) private readonly marketModel: Model<MarketDocument>,
    @InjectModel(FactoryMarket.name) private readonly factoryMarketModel: Model<FactoryMarket>,
    @InjectModel(FarmMarket.name) private readonly farmMarketModel: Model<FarmMarket>,
    @InjectModel(GroceryMarket.name) private readonly groceryMarketModel: Model<GroceryMarket>,
    @InjectModel(NormalMarket.name) private readonly normalMarketModel: Model<NormalMarket>,
  ) {}

  async createMarket(createMarketDto: CreateMarketDto): Promise<Market> {
    try {
      this.logger.log(`Creating market: ${JSON.stringify(createMarketDto)}`);
      const { marketType, ...marketData } = createMarketDto;

      if (!Object.values(MarketType).includes(marketType as MarketType)) {
        this.logger.warn(`Invalid market type: ${marketType}`);
        throw new BadRequestException(`Invalid market type. Allowed: ${Object.values(MarketType).join(', ')}`);
      }

      let newMarket;
      switch (marketType) {
        case MarketType.FACTORY:
          newMarket = new this.factoryMarketModel({ ...marketData, marketType });
          break;
        case MarketType.FARM:
          newMarket = new this.farmMarketModel({ ...marketData, marketType });
          break;
        case MarketType.GROCERY:
          newMarket = new this.groceryMarketModel({ ...marketData, marketType });
          break;
        case MarketType.NORMAL:
          newMarket = new this.normalMarketModel({ ...marketData, marketType });
          break;
        default:
          throw new BadRequestException('Invalid market type');
      }

      const savedMarket = await newMarket.save();
      this.logger.log(`Market created: ${savedMarket._id}`);
      return savedMarket;
    } catch (error) {
      this.logger.error(`Error creating market: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create market');
    }
  }

  async getAllMarkets(): Promise<Market[]> {
    try {
      this.logger.log('Fetching all markets...');
      const factoryMarkets = await this.factoryMarketModel.find().exec();
      const farmerMarkets = await this.farmMarketModel.find().exec();
      const groceryMarkets = await this.groceryMarketModel.find().exec();
      const normalMarkets = await this.normalMarketModel.find().exec();
      const allMarkets = [...factoryMarkets, ...farmerMarkets, ...groceryMarkets, ...normalMarkets];

      this.logger.log(`Total markets fetched: ${allMarkets.length}`);
      return allMarkets;
    } catch (error) {
      this.logger.error(`Error fetching markets: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch markets');
    }
  }

  async getAllMarketsByType(marketType: MarketType): Promise<Market[]> {
    try {
      this.logger.log(`Fetching markets by type: ${marketType}`);
  
      let markets;
  
      switch (marketType) {
        case MarketType.FACTORY:
          markets = await this.factoryMarketModel.find().exec();
          break;
        case MarketType.FARM:
          markets = await this.farmMarketModel.find().exec();
          break;
        case MarketType.GROCERY:
          markets = await this.groceryMarketModel.find().exec();
          break;
        case MarketType.NORMAL:
          markets = await this.normalMarketModel.find().exec();
          break;
        default:
          throw new BadRequestException(`Invalid market type. Allowed: ${Object.values(MarketType).join(', ')}`);
      }
  
      this.logger.log(`Total ${marketType} markets fetched: ${markets.length}`);
      return markets;
    } catch (error) {
      this.logger.error(`Error fetching markets by type: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch markets of type ${marketType}`);
    }
  }
  

  async getMarketById(id: string, marketType: MarketType): Promise<Market> {
    try {
      this.logger.log(`Fetching market by ID: ${id} and type: ${marketType}`);
  
      let market;
  
      switch (marketType) {
        case MarketType.FACTORY:
          market = await this.factoryMarketModel.findById(id).exec();
          break;
        case MarketType.FARM:
          market = await this.farmMarketModel.findById(id).exec();
          break;
        case MarketType.GROCERY:
          market = await this.groceryMarketModel.findById(id).exec();
          break;
        case MarketType.NORMAL:
          market = await this.normalMarketModel.findById(id).exec();
          break;
        default:
          throw new BadRequestException(`Invalid market type. Allowed: ${Object.values(MarketType).join(', ')}`);
      }
  
      if (!market) {
        this.logger.warn(`Market with ID ${id} not found in type ${marketType}`);
        throw new NotFoundException(`Market with ID ${id} not found in type ${marketType}`);
      }
  
      return market;
    } catch (error) {
      this.logger.error(`Error fetching market by ID: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch market');
    }
  }
  
  async updateMarket(id: string, marketType: MarketType, updateMarketDto: Partial<CreateMarketDto>): Promise<Market> {
    try {
      this.logger.log(`Updating market ${id} of type ${marketType} with data: ${JSON.stringify(updateMarketDto)}`);
  
      let updatedMarket;
  
      switch (marketType) {
        case MarketType.FACTORY:
          updatedMarket = await this.factoryMarketModel.findByIdAndUpdate(id, updateMarketDto, { new: true }).exec();
          break;
        case MarketType.FARM:
          updatedMarket = await this.farmMarketModel.findByIdAndUpdate(id, updateMarketDto, { new: true }).exec();
          break;
        case MarketType.GROCERY:
          updatedMarket = await this.groceryMarketModel.findByIdAndUpdate(id, updateMarketDto, { new: true }).exec();
          break;
        case MarketType.NORMAL:
          updatedMarket = await this.normalMarketModel.findByIdAndUpdate(id, updateMarketDto, { new: true }).exec();
          break;
        default:
          throw new BadRequestException(`Invalid market type. Allowed: ${Object.values(MarketType).join(', ')}`);
      }
  
      if (!updatedMarket) {
        this.logger.warn(`Market with ID ${id} not found in type ${marketType}`);
        throw new NotFoundException(`Market with ID ${id} not found in type ${marketType}`);
      }
  
      this.logger.log(`Market ${id} updated successfully`);
      return updatedMarket;
    } catch (error) {
      this.logger.error(`Error updating market: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update market');
    }
  }
  
  async deleteMarket(id: string, marketType: MarketType): Promise<void> {
    try {
      this.logger.log(`Deleting market with ID: ${id} and type: ${marketType}`);
  
      let deletedMarket;
  
      switch (marketType) {
        case MarketType.FACTORY:
          deletedMarket = await this.factoryMarketModel.findByIdAndDelete(id).exec();
          break;
        case MarketType.FARM:
          deletedMarket = await this.farmMarketModel.findByIdAndDelete(id).exec();
          break;
        case MarketType.GROCERY:
          deletedMarket = await this.groceryMarketModel.findByIdAndDelete(id).exec();
          break;
        case MarketType.NORMAL:
          deletedMarket = await this.normalMarketModel.findByIdAndDelete(id).exec();
          break;
        default:
          throw new BadRequestException(`Invalid market type. Allowed: ${Object.values(MarketType).join(', ')}`);
      }
  
      if (!deletedMarket) {
        this.logger.warn(`Market with ID ${id} not found in type ${marketType}`);
        throw new NotFoundException(`Market with ID ${id} not found in type ${marketType}`);
      }
  
      this.logger.log(`Market ${id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting market: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete market');
    }
  }
}
