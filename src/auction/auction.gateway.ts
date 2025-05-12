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
import { forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuctionService } from './auction.service';
import { OrderService } from 'src/order/order.service';
import { FarmCrop } from 'src/farm-crop/Schema/farm-crop.schema';
import { User } from 'src/users/Schemas/User.schema';

@WebSocketGateway(3008, { cors: true })
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @InjectModel(FarmCrop.name) private readonly cropModel: Model<FarmCrop>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(forwardRef(() => AuctionService))
    private readonly auctionService: AuctionService,
    public readonly orderService: OrderService,
  ) {}

  // ----------- Connection Events -----------

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: `Welcome, ${client.id}` });

    client.broadcast.emit('bidderJoined', {
      message: `${client.id} has joined the auction platform`,
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    client.broadcast.emit('bidderLeft', {
      message: `${client.id} has left the auction platform`,
    });
  }
  @SubscribeMessage('registerUser')
  async handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody('userId') userId: string,
  ) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      client.emit('error', { message: 'User not found' });
      return;
    }
  
    // Optionally, store user info in the socket for later use
    (client as any).userId = userId;
    (client as any).userName = user.name;
  
    client.emit('connected', { message: `Welcome, ${user.name}` });
    client.broadcast.emit('bidderJoined', {
      message: `${user.name} has joined the auction platform`,
    });
  }
  // ----------- Room & Auction Channel Events -----------

  @SubscribeMessage('joinUserRoom')
  async handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('userId') userId: string,
  ) {
    client.join(userId);
    client.emit('joinedUserRoom', { userId });
    console.log(`User ${userId} joined user-specific room`);
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody('auctionId') auctionId: string,
    @MessageBody('bidderId') bidderId: string,
  ) {
    client.join(auctionId);

    const auction = await this.auctionService.getAuctionById(auctionId);

    // Notify the joining bidder personally
    client.emit('joinedAuction', {
      auctionId,
      auction,
      message: 'You joined the auction successfully',
    });

    // Notify everyone ELSE in this auction room about the new joiner
    client.broadcast.to(auctionId).emit('bidderJoinedAuction', {
      auctionId,
      bidderId,
      time: new Date().toISOString(),
      message: `Bidder ${bidderId} has joined the auction`,
    });
  }

  // ----------- Bidding Events -----------

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

      // Notify ALL users in the auction room about the new bid (including the bidder)
      this.server.to(data.auctionId).emit('auctionUpdated', {
        auction: updatedAuction,
        message: `Bidder ${data.bidderId} placed a bid of ${data.bidAmount}`,
      });

      // Optionally, notify only the bidder directly (for success feedback)
      client.emit('bidSuccess', {
        auction: updatedAuction,
        message: 'Your bid was placed successfully',
      });

      console.log(
        `Bid placed successfully: ${data.bidAmount} by ${data.bidderId} in auction ${data.auctionId}`,
      );
    } catch (error) {
      console.error(`Error placing bid: ${error.message}`);
      client.emit('bidError', { error: error.message });
    }
  }

  // ----------- Market Selection / Order Creation Events -----------

  @SubscribeMessage('marketSelected')
  async handleMarketSelected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string; marketId: string },
  ) {
    try {
      const auction = await this.auctionService.getAuctionById(data.auctionId);

      if (!auction || !auction.soldTo) {
        client.emit('orderError', { error: 'Auction not found or no winner.' });
        return;
      }

      // Get the highest bid
      const bids = auction.bids || [];
      const highestBid = bids.reduce(
        (max, bid) => (bid.bidAmount > (max?.bidAmount ?? 0) ? bid : max),
        null as any,
      );
      if (!highestBid) {
        client.emit('orderError', { error: 'No valid bids for this auction.' });
        return;
      }

      // Get crop info
      const crop = await this.cropModel.findById(auction.product).exec();
      if (!crop) {
        client.emit('orderError', { error: 'Crop not found.' });
        return;
      }

      // Build order DTO
      const createOrderDto = {
        normalMarket: data.marketId,
        products: [
          {
            productId: auction.product.toString(),
            stock: crop.quantity,
          },
        ],
        user: highestBid.bidderId.toString(),
        dateOrder: new Date(),
        isConfirmed: false,
        orderStatus: 'isProcessing',
        totalPrice: highestBid.bidAmount,
      };

      await this.orderService.createAnOrder(createOrderDto);

      // Notify only the client who initiated the market selection
      client.emit('orderCreated', {
        auctionId: auction._id,
        userId: highestBid.bidderId,
        marketId: data.marketId,
      });
      // Notify all users in the auction room that the auction has ended
      this.server.to(auction._id.toString()).emit('auctionEnded', { auctionId: auction._id });
    } catch (error) {
      client.emit('orderError', { error: error.message });
    }
  }
}