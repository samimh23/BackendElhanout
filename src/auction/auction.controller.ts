import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { Auction } from './schema/auction.schema';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post()
  createAuction(@Body() dto: CreateAuctionDto): Promise<Auction> {
    return this.auctionService.createAuction(dto);
  }

  @Get()
  getActiveAuctions(): Promise<Auction[]> {
    return this.auctionService.getActiveAuctions();
  }

  @Get(':id')
  getAuctionById(@Param('id') id: string): Promise<Auction> {
    return this.auctionService.getAuctionById(id);
  }

  @Post('bid/:id')
  placeBid(@Param('id') auctionId: string, @Body() dto: PlaceBidDto): Promise<Auction> {
    return this.auctionService.placeBid(auctionId, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') auctionId: string, @Body('status') status: Auction['status']): Promise<Auction> {
    return this.auctionService.updateAuctionStatus(auctionId, status);
  }

  @Get('bidder/:id')
  getByBidder(@Param('id') bidderId: string): Promise<Auction[]> {
    return this.auctionService.getAuctionByBidderId(bidderId);
  }

  @Get('bidders/:id')
  getBidders(@Param('id') auctionId: string): Promise<{ bidderIds: string[] }> {
    return this.auctionService.getBiddersByAuctionId(auctionId);
  }
}