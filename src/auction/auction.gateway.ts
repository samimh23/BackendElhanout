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
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway(3008, { cors: true })
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => AuctionService))
    private readonly auctionService: AuctionService
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: `Welcome, ${client.id}` });
    client.broadcast.emit('bidderJoined', {
      message: `${client.id} has joined the auction`,
    });
  }

  handleDisconnect(client: Socket) {
    this.server.emit('bidderLeft', {
      message: `${client.id} has left the auction`,
    });
  }

  // Client joins a specific auction room
  @SubscribeMessage('joinAuction')
async handleJoinAuction(
  @ConnectedSocket() client: Socket,
  @MessageBody('auctionId') auctionId: string,
) {
  console.log(`Client ${client.id} joined auction: ${auctionId}`);
  client.join(auctionId);

  // Fetch the current auction with bids
  const auction = await this.auctionService.getAuctionById(auctionId);

  // Emit both joined event and current auction
  client.emit('joinedAuction', { auctionId, auction });
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
}