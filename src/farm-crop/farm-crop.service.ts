import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FarmCrop, FarmCropDocument } from './Schema/farm-crop.schema';
import { CreateFarmCropDto } from './dto/create-farm-crop.dto';
import { UpdateFarmCropDto } from './dto/update-farm-crop.dto';

@Injectable()
export class FarmCropService {
  constructor(@InjectModel(FarmCrop.name) private farmCropModel: Model<FarmCropDocument>) {}

  async create(createFarmCropDto: CreateFarmCropDto): Promise<FarmCrop> {
    const farmCrop = new this.farmCropModel(createFarmCropDto);
    return farmCrop.save();
  }

  async findAll(): Promise<FarmCrop[]> {
    return this.farmCropModel.find().exec();
  }

  async findByFarmId(farmMarketId: string): Promise<FarmCrop[]> {
    return this.farmCropModel.find({ farmMarketId }).exec();
  }

  async findOne(id: string): Promise<FarmCrop> {
    const farmCrop = await this.farmCropModel.findById(id).exec();
    if (!farmCrop) {
      throw new NotFoundException(`FarmCrop with ID ${id} not found`);
    }
    return farmCrop;
  }

  async update(id: string, updateFarmCropDto: UpdateFarmCropDto): Promise<FarmCrop> {
    const updatedFarmCrop = await this.farmCropModel.findByIdAndUpdate(id, updateFarmCropDto, { new: true }).exec();
    if (!updatedFarmCrop) {
      throw new NotFoundException(`FarmCrop with ID ${id} not found`);
    }
    return updatedFarmCrop;
  }


  async findByFarmId(farmMarketId: string): Promise<FarmCrop[]> {
    return this.farmCropModel.find({ farmMarketId }).exec();
  }


  async delete(id: string): Promise<FarmCrop> {
    const deletedFarmCrop = await this.farmCropModel.findByIdAndDelete(id).exec();
    if (!deletedFarmCrop) {
      throw new NotFoundException(`FarmCrop with ID ${id} not found`);
    }
    return deletedFarmCrop;
  }
}
