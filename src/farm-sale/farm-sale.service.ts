import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument, SaleType, SaleStatus } from './Schema/farm-sale.schema';
import { CreateSaleDto } from './dto/create-farm-sale.dto';
import { UpdateSaleDto } from './dto/update-farm-sale.dto';

@Injectable()
export class FarmSaleService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
  ) {}

 // In your FarmSaleService
async create(createSaleDto: CreateSaleDto): Promise<SaleDocument> {
  // Validate auction-specific fields
  if (createSaleDto.type === SaleType.AUCTION) {
    if (!createSaleDto.auctionStartDate || !createSaleDto.auctionEndDate || !createSaleDto.startingBid) {
      throw new Error('Auction requires start date, end date, and starting bid');
    }
  }

  const createdSale = new this.saleModel({
    ...createSaleDto,
    createdDate: new Date(),
    status: SaleStatus.PENDING,
  });
  
  // For auctions, set the starting bid as the current bid
  if (createSaleDto.type === SaleType.AUCTION) {
    createdSale.currentBid = createSaleDto.startingBid;
  }
  
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

  // Add this method to your FarmSaleService class
async findByType(type: SaleType): Promise<SaleDocument[]> {
  return this.saleModel.find({ type }).exec();
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

  async completeSale(id: string, buyerName: string, buyerContact?: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid sale ID format`);
    }
    
    const sale = await this.saleModel.findById(id).exec();
    
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    
    if (sale.status !== SaleStatus.PENDING) {
      throw new Error(`Sale is already ${sale.status}`);
    }
    
    sale.status = SaleStatus.COMPLETED;
    sale.completedDate = new Date();
    sale.buyerName = buyerName;
    
    if (buyerContact) {
      sale.buyerContact = buyerContact;
    }
    
    return sale.save();
  }

  async cancelSale(id: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid sale ID format`);
    }
    
    const sale = await this.saleModel.findById(id).exec();
    
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    
    if (sale.status !== SaleStatus.PENDING) {
      throw new Error(`Sale is already ${sale.status}`);
    }
    
    sale.status = SaleStatus.CANCELLED;
    return sale.save();
  }

  // For auction sales
  async addBid(id: string, bidderName: string, amount: number, bidderContact?: string): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid sale ID format`);
    }
    
    const sale = await this.saleModel.findById(id).exec();
    
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    
    if (sale.status !== SaleStatus.PENDING) {
      throw new Error(`Cannot add bid to a ${sale.status} sale`);
    }
    
    if (!sale.auctionEndDate || new Date() > sale.auctionEndDate) {
      throw new Error('Auction has ended');
    }
    
    if (sale.currentBid && amount <= sale.currentBid) {
      throw new Error(`Bid amount must be greater than current bid: ${sale.currentBid}`);
    }
    
    if (!sale.currentBid && sale.startingBid && amount < sale.startingBid) {
      throw new Error(`Bid amount must be at least the starting bid: ${sale.startingBid}`);
    }
    
    const newBid = {
      id: new Types.ObjectId().toString(),
      bidderName,
      amount,
      bidTime: new Date(),
      bidderContact,
    };
    
    sale.bids.push(newBid);
    sale.currentBid = amount;
    sale.currentBidder = bidderName;
    
    return sale.save();
  }
}