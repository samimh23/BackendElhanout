import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuctionService } from './auction.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Order } from 'src/order/entities/order.schema';
import { OrderService } from 'src/order/order.service';
import { InjectModel } from '@nestjs/mongoose';
import { FarmCrop } from 'src/farm-crop/Schema/farm-crop.schema';
import { Model } from 'mongoose';

@WebSocketGateway(3008, { cors: true })
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @InjectModel(FarmCrop.name) private readonly cropModel: Model<FarmCrop>,
    @Inject(forwardRef(() => AuctionService))
    private readonly auctionService: AuctionService,
    public readonly orderService: OrderService
  ) {}
  @SubscribeMessage('joinUserRoom')
  async handleJoinUserRoom(@ConnectedSocket() client: Socket, @MessageBody('userId') userId: string) {
    client.join(userId);
  }
  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: `Welcome, ${client.id}` });
    client.broadcast.emit('bidderJoined', {
      message: `${client.id} has joined the auction`,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    client.broadcast.emit('bidderLeft', {
      message: `${client.id} has left the auction`,
    });
    this.server.emit('bidderLeft', {
      message: `${client.id} has left the auction`,
    });
  }

  // Client joins a specific auction room
  @SubscribeMessage('joinAuction')
  async handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody('auctionId') auctionId: string,
    @MessageBody('bidderId') bidderId: string, // Pass bidderId from frontend!
  ) {
    client.join(auctionId);
    const auction = await this.auctionService.getAuctionById(auctionId);
    client.emit('joinedAuction', { auctionId, auction });
    // Broadcast to room (except sender)
    client.broadcast.to(auctionId).emit('userJoined', {
      auctionId,
      bidderId,
      time: new Date().toISOString(),
    });
  }

  // Client places a bid
  @SubscribeMessage('bidPlaced')
  async handleBidPlaced(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string; bidderId: string; bidAmount: number },
  ) {
    try {
      const updatedAuction = await this.auctionService.placeBid(data.auctionId, {
        bidderId: data.bidderId,
        bidAmount: data.bidAmount,
        bidTime: new Date(),
      });

      // Notify all in the auction room
      this.server.to(data.auctionId).emit('auctionUpdated', updatedAuction);
      client.emit('bidSuccess', updatedAuction);
      console.log(`Bid placed successfully: ${data.bidAmount} by ${data.bidderId}`);
    } catch (error) {
      console.error(`Error placing bid: ${error.message}`);
      client.emit('bidError', { error: error.message });
    }
  }


  @SubscribeMessage('marketSelected')
async handleMarketSelected(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { auctionId: string, marketId: string }
) {
  try {
    const auction = await this.auctionService.getAuctionById(data.auctionId);
    if (!auction || !auction.soldTo) {
      client.emit('orderError', { error: 'Auction not found or no winner.' });
      return;
    }
    // Get the highest bid
    const bids = auction.bids || [];
    const highestBid = bids.reduce((max, bid) => bid.bidAmount > (max?.bidAmount ?? 0) ? bid : max, null);
    if (!highestBid) {
      client.emit('orderError', { error: 'No valid bids for this auction.' });
      return;
    }
    // Get crop info
    const crop = await this.cropModel.findById(auction.cropId).exec();
    if (!crop) {
      client.emit('orderError', { error: 'Crop not found.' });
      return;
    }
    // Build order DTO
    const createOrderDto = {
      normalMarket: data.marketId,
      products: [{
        productId: auction.cropId.toString(),
        stock: crop.quantity,
      }],
      user: highestBid.bidderId.toString(),
      dateOrder: new Date(),
      isConfirmed: false,
      orderStatus: "isProcessing",
      totalPrice: highestBid.bidAmount,
    };
    await this.orderService.createAnOrder(createOrderDto);

    client.emit('orderCreated', {
      auctionId: auction._id,
      userId: highestBid.bidderId,
      marketId: data.marketId,
    });
    this.server.to(auction._id.toString()).emit('auctionEnded', { auctionId: auction._id });
  } catch (error) {
    client.emit('orderError', { error: error.message });
  }
}
}