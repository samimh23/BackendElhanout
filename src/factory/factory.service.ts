import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FactoryMarket } from './schema/factory.schema';
import { CreateFactoryDto } from './dto/create-factory.dto';

@Injectable()
export class FactoryService {
  private readonly logger = new Logger(FactoryService.name);

  constructor(
    @InjectModel(FactoryMarket.name) private readonly factoryMarketModel: Model<FactoryMarket>,
  ) {}

  async createMarket(createMarketDto: CreateFactoryDto): Promise<FactoryMarket> {
    try {
      this.logger.log(`Creating factory market: ${JSON.stringify(createMarketDto)}`);
      const newMarket = new this.factoryMarketModel(createMarketDto);
      return await newMarket.save();
    } catch (error) {
      this.logger.error(`Error creating factory market: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create factory market');
    }
  }

  async getAllMarkets(): Promise<FactoryMarket[]> {
    return await this.factoryMarketModel.find().exec();
  }

  async getMarketById(id: string): Promise<FactoryMarket> {
    const market = await this.factoryMarketModel.findById(id).exec();
    if (!market) {
      throw new NotFoundException(`Factory market with ID ${id} not found`);
    }
    return market;
  }

  async updateMarket(id: string, updateMarketDto: Partial<CreateFactoryDto>): Promise<FactoryMarket> {
    const updatedMarket = await this.factoryMarketModel.findByIdAndUpdate(id, updateMarketDto, { new: true }).exec();
    if (!updatedMarket) {
      throw new NotFoundException(`Factory market with ID ${id} not found`);
    }
    return updatedMarket;
  }

  async deleteMarket(id: string): Promise<void> {
    const deletedMarket = await this.factoryMarketModel.findByIdAndDelete(id).exec();
    if (!deletedMarket) {
      throw new NotFoundException(`Factory market with ID ${id} not found`);
    }
  }
}