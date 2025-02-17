import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WholesalerMarket } from './schema/wholesaler_market.schema';
import { CreateWholesalerMarketDto } from './dto/create-wholesaler_market.dto';

@Injectable()
export class WholesalerMarketService {
  constructor(
    @InjectModel(WholesalerMarket.name) private wholesalerMarketModel: Model<WholesalerMarket>,
  ) {}

  // Create a new WholesalerMarket
  async create(createWholesalerMarketDto: CreateWholesalerMarketDto): Promise<WholesalerMarket> {
    const newMarket = new this.wholesalerMarketModel(createWholesalerMarketDto);
    return newMarket.save();
  }

  // Find all WholesalerMarkets
  async findAll(): Promise<WholesalerMarket[]> {
    return this.wholesalerMarketModel.find().exec();
  }

  // Find one WholesalerMarket by id
  async findOne(id: string): Promise<WholesalerMarket> {
    return this.wholesalerMarketModel.findById(id).exec();
  }

  // Update a WholesalerMarket
  async update(id: string, updateWholesalerMarketDto: CreateWholesalerMarketDto): Promise<WholesalerMarket> {
    return this.wholesalerMarketModel.findByIdAndUpdate(id, updateWholesalerMarketDto, { new: true }).exec();
  }

  // Delete a WholesalerMarket
  async remove(id: string): Promise<WholesalerMarket> {
    return this.wholesalerMarketModel.findByIdAndDelete(id).exec();
  }
}
