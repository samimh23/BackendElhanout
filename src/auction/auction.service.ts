import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Auction } from './schema/auction.schema';
import { User } from 'src/users/Schemas/User.schema';
import { AuctionGateway } from './auction.gateway';
import * as crypto from 'crypto';
import { OrderService } from 'src/order/order.service';
import { FarmCrop } from 'src/farm-crop/Schema/farm-crop.schema';

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<Auction>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(FarmCrop.name) private readonly cropModel: Model<FarmCrop>,
    private readonly orderService: OrderService,
    private readonly moduleRef: ModuleRef,
  ) {}

  /** Lazily resolve the gateway to broadcast events */
  private get gateway() {
    return this.moduleRef.get(AuctionGateway, { strict: false });
  }

  async createAuction(dto: CreateAuctionDto): Promise<Auction> {
    const auction = new this.auctionModel({
      product: new Types.ObjectId(dto.product),
      description: dto.description,
      farmerId: new Types.ObjectId(dto.farmerId),
      startingPrice: dto.startingPrice,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status || 'active',
    });
    return auction.save();
  }

  async getActiveAuctions(): Promise<Auction[]> {
    return this.auctionModel.find({ status: 'active' }).exec();
  }

  async getAuctionById(id: string): Promise<Auction> {
    const auc = await this.auctionModel.findById(id).exec();
    if (!auc) throw new BadRequestException('Auction not found');
    return auc;
  }

  async placeBid(auctionId: string, bid: PlaceBidDto): Promise<Auction> {
    const auction = await this.getAuctionById(auctionId);
    const now = new Date();

    if (now < auction.startTime || now > auction.endTime || auction.status !== 'active') {
      throw new BadRequestException('Auction is not active');
    }
    if (bid.bidAmount < auction.startingPrice) {
      throw new BadRequestException('Bid amount too low');
    }

    auction.bids.push({
      bidderId: new Types.ObjectId(bid.bidderId),
      bidAmount: bid.bidAmount,
      bidTime: now,
    });
    const updated = await auction.save();

    // Broadcast the bid update
    this.gateway.server.to(auctionId).emit('auctionUpdated', updated);

    return updated;
  }

  async updateAuctionStatus(id: string, status: Auction['status']): Promise<Auction> {
    const updated = await this.auctionModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    if (!updated) throw new BadRequestException('Auction not found');
    // Notify status change
    this.gateway.server.to(id).emit('auctionStatusUpdated', { auctionId: id, status });
    return updated;
  }

  async getAuctionByBidderId(bidderId: string): Promise<Auction[]> {
    return this.auctionModel.find({ 'bids.bidderId': bidderId }).exec();
  }

  async getBiddersByAuctionId(id: string): Promise<any[]> {
    const auction = await this.auctionModel.findById(id).lean().exec();
    if (!auction) throw new BadRequestException('Auction not found');
    // Return the full array of bid objects, not just bidderIds!
    return auction.bids;
  }

  @Cron(CronExpression.EVERY_SECOND)
  async closeExpiredAuctions(): Promise<void> {
    const now = new Date();
    const expired = await this.auctionModel.find({
      status: 'active',
      endTime: { $lte: now },
    }).exec();
  
    for (const auc of expired) {
      const bids = auc.bids || [];
      if (bids.length === 0) {
        auc.status = 'completed';
        await auc.save();
        this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
        continue;
      }
  
      // Find highest bid
      const highestBid = bids.reduce((max, bid) => {
        return bid.bidAmount > (max?.bidAmount ?? 0) ? bid : max;
      }, null);
  
      if (!highestBid) {
        auc.status = 'completed';
        await auc.save();
        this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
        continue;
      }
  
      auc.soldTo = highestBid.bidderId;
      auc.status = 'completed';
      await auc.save();
  
      // Fetch the winning user (merchant)
      const user = await this.userModel.findById(highestBid.bidderId).exec();
      if (!user) {
        this.logger.error(`User not found for highest bidder in auction ${auc._id}`);
        this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
        continue;
      }
  
      let markets = user.markets;
      if (!markets || (Array.isArray(markets) && markets.length === 0)) {
        this.logger.error(`No markets found for winner user ${user._id} in auction ${auc._id}`);
        this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
        continue;
      }
  
      if (Array.isArray(markets) && markets.length > 1) {
        // Notify winner to select a market
        this.logger.log(`Emitting marketSelectionRequired to ${highestBid.bidderId}:`, {
          auctionId: auc._id.toString(),
          product: auc.product.toString(),
          markets: markets.map(m => m.toString()),
          totalPrice: highestBid.bidAmount,
        });
        this.gateway.server.to(highestBid.bidderId.toString()).emit('marketSelectionRequired', {
          auctionId: auc._id.toString(),
          product: auc.product.toString(),
          markets: markets.map(m => m.toString()), // send list of market IDs
          totalPrice: highestBid.bidAmount,
        });
        this.logger.log(
          `User ${user._id} must select a market for auction ${auc._id}`
        );
        this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
        continue;
      }
     const crop = await this.cropModel.findById(auc.product).exec();
      // Only one market: proceed to create order
      const normalMarket = Array.isArray(markets) ? markets[0] : markets;
      const createOrderDto = {
        normalMarket: normalMarket.toString(),
        products: [{
          productId: auc.product.toString(),
          stock: crop.quantity,
        }],
        user: highestBid.bidderId.toString(),
        dateOrder: new Date(),
        isConfirmed: false,
        orderStatus: "isProcessing",
        totalPrice: highestBid.bidAmount,
      };
  
      try {
        await this.orderService.createAnOrder(createOrderDto);
        this.gateway.server.to(auc._id.toString()).emit('orderCreated', {
          auctionId: auc._id,
          userId: highestBid.bidderId,
        });
      } catch (error) {
        this.logger.error(
          `Failed to create order for auction ${auc._id} and user ${highestBid.bidderId}: ${error}`
        );
      }
  
      this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
    }
  }
  async getAuctionsByfarmerId(farmerId: string): Promise<Auction[]> {
    return this.auctionModel.find({ 'farmerId': farmerId }).exec();
  }
  async deleteAuction(id: string): Promise<void> {
        await this.auctionModel.findByIdAndDelete(id).exec();
  }
}
