import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument,} from './Schema/farm-sale.schema';
import { CreateSaleDto } from './dto/create-farm-sale.dto';
import { UpdateSaleDto } from './dto/update-farm-sale.dto';

@Injectable()
export class FarmSaleService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
  ) {}

async create(createSaleDto: CreateSaleDto): Promise<SaleDocument> {

  const createdSale = new this.saleModel({
    ...createSaleDto,
    createdDate: new Date(),

  });
  
  return createdSale.save();
}

  async findAll(): Promise<SaleDocument[]> {
    return this.saleModel.find().exec();
  }

  async findOne(id: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid sale ID format`);
    }
    
    const sale = await this.saleModel.findById(id).exec();
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    
    return sale;
  }


  async getSalesByCropId(cropId: string): Promise<SaleDocument[]> {
    if (!Types.ObjectId.isValid(cropId)) {
      throw new NotFoundException(`Invalid crop ID format`);
    }
    
    return this.saleModel.find({ farmCropId: new Types.ObjectId(cropId) }).exec();
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid sale ID format`);
    }
    
    const updatedSale = await this.saleModel.findByIdAndUpdate(
      id,
      updateSaleDto,
      { new: true },
    ).exec();
    
    if (!updatedSale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    
    return updatedSale;
  }

  async remove(id: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid sale ID format`);
    }
    
    const deletedSale = await this.saleModel.findByIdAndDelete(id).exec();
    
    if (!deletedSale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    
    return deletedSale;
  }
}