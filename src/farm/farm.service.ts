import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { FarmMarket } from './schema/farm.schema';
import { CreateFarmMarketDto } from './dto/create-farm.dto';

@Injectable()
export class FarmService {
  constructor(
    @InjectModel(FarmMarket.name) private farmMarketModel: Model<FarmMarket>,
  ) {}

  // Create a new FarmMarket
  async create(createFarmMarketDto: CreateFarmMarketDto): Promise<FarmMarket> {
    const newMarket = new this.farmMarketModel(createFarmMarketDto);
    return newMarket.save();
  }

  // Find all FarmMarkets
  async findAll(): Promise<FarmMarket[]> {
    return this.farmMarketModel.find().exec();
  }

  async findByFarmerId(owner: string): Promise<FarmMarket[]> {
    return this.farmMarketModel.find({ owner }).exec();
  }

  // Find one FarmMarket by id
  async findOne(id: string): Promise<FarmMarket> {
    return this.farmMarketModel.findById(id).exec();
  }

  // Update a FarmMarket
  async update(id: string, updateFarmMarketDto: CreateFarmMarketDto): Promise<FarmMarket> {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestException('Invalid farm market ID');
    }
    
    const updatedMarket = await this.farmMarketModel.findByIdAndUpdate(
      id, 
      updateFarmMarketDto, 
      { new: true }
    ).exec();
    
    if (!updatedMarket) {
      throw new BadRequestException(`Farm market with ID ${id} not found`);
    }
    
    return updatedMarket;
  }

  // Delete a FarmMarket
  async remove(id: string): Promise<FarmMarket> {
    return this.farmMarketModel.findByIdAndDelete(id).exec();
  }
}
