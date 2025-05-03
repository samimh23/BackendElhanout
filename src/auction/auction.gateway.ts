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
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody('auctionId') auctionId: string,
  ) {
    client.join(auctionId);
    client.emit('joinedAuction', { auctionId });
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
    } catch (error) {
      client.emit('bidError', { error: error.message });
    }
  }
}