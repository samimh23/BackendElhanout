import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NormalMarket } from './schema/normal-market.schema';
import { CreateMarketDto } from './dto/create-market.dto';

@Injectable()
export class MarketService {
  constructor(
    @InjectModel(NormalMarket.name) private normalMarketModel: Model<NormalMarket>,
  ) {}

  // Create a new NormalMarket
  async create(createNormalMarketDto: CreateMarketDto): Promise<NormalMarket> {
    const newMarket = new this.normalMarketModel(createNormalMarketDto);
    return newMarket.save();
  }

  // Find all NormalMarkets
  async findAll(): Promise<NormalMarket[]> {
    return this.normalMarketModel.find().exec();
  }

  // Find one NormalMarket by id
  async findOne(id: string): Promise<NormalMarket> {
    return this.normalMarketModel.findById(id).exec();
  }

  async update(id: string, updateNormalMarketDto: CreateMarketDto): Promise<NormalMarket> {
    return this.normalMarketModel.findByIdAndUpdate(id, updateNormalMarketDto, { new: true }).exec();
  }

  async remove(id: string): Promise<NormalMarket> {
    return this.normalMarketModel.findByIdAndDelete(id).exec();
  }
}
