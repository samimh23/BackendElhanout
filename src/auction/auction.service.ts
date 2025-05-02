import { Injectable, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<Auction>,
    private readonly moduleRef: ModuleRef,
  ) {}

  /** Lazily resolve the gateway to broadcast events */
  private get gateway() {
    return this.moduleRef.get(AuctionGateway, { strict: false });
  }

  async createAuction(dto: CreateAuctionDto): Promise<Auction> {
    const auction = new this.auctionModel({
      cropId: new Types.ObjectId(dto.cropId),
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

  /** Cron job that runs every sec to close expired auctions */
  @Cron(CronExpression.EVERY_SECOND)
  async closeExpiredAuctions(): Promise<void> {
    const now = new Date();
    const expired = await this.auctionModel.find({
      status: 'active',
      endTime: { $lte: now },
    });

    for (const auc of expired) {
      auc.status = 'completed';
      await auc.save();
      this.gateway.server.to(auc._id.toString()).emit('auctionEnded', { auctionId: auc._id });
    }
  }

  async getAuctionsByfarmerId(farmerId: string): Promise<Auction[]> {
    return this.auctionModel.find({ 'farmerId': farmerId }).exec();
  }
}
