// auction-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument, SaleType, SaleStatus } from './Schema/farm-sale.schema';
import { FarmSaleService } from './farm-sale.service';

@Injectable()
export class AuctionCronService {
  private readonly logger = new Logger(AuctionCronService.name);

  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    private readonly farmSaleService: FarmSaleService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEndedAuctions() {
    this.logger.debug('Checking for ended auctions...');
    
    const now = new Date();
    
    // Find auctions that have ended but are still pending
    const endedAuctions = await this.saleModel.find({
      type: SaleType.AUCTION,
      status: SaleStatus.PENDING,
      auctionEndDate: { $lt: now },
    }).exec();
    
    this.logger.debug(`Found ${endedAuctions.length} ended auctions`);
    
    // Process each ended auction
    for (const auction of endedAuctions) {
      try {
        if (auction.bids.length > 0) {
          // Complete the auction with the highest bidder
          const highestBid = auction.bids
            .sort((a, b) => b.amount - a.amount)[0];
            
          await this.farmSaleService.completeSale(
            auction._id.toString(), 
            highestBid.bidderName, 
            highestBid.bidderContact
          );
          
          this.logger.debug(`Completed auction ${auction._id} with winner ${highestBid.bidderName}`);
        } else {
          // Cancel the auction if no bids were placed
          await this.farmSaleService.cancelSale(auction._id.toString());
          this.logger.debug(`Cancelled auction ${auction._id} due to no bids`);
        }
      } catch (error) {
        this.logger.error(`Error processing auction ${auction._id}: ${error.message}`);
      }
    }
  }
}