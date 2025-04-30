import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { PlaceBidDto } from './dto/place-bid.dto';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly auctionService: AuctionService) {}

  @WebSocketServer() server: Server;

  
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('joinAuction')
async onJoin(
  @ConnectedSocket() client: Socket,
  @MessageBody() auctionId: string
) {
  client.join(auctionId);
  const auction = await this.auctionService.getAuctionById(auctionId);
  console.log(`Client ${client.id} joined auction ${auctionId}`);
  // this is the line that sends you the current state:
  client.emit('auctionState', auction);
}


  @SubscribeMessage('leaveAuction')
  onLeave(@ConnectedSocket() client: Socket, @MessageBody() auctionId: string) {
    client.leave(auctionId);
  }

  @SubscribeMessage('placeBid')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async onBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { auctionId: string; bid: PlaceBidDto },
  ) {
    try {
      const updated = await this.auctionService.placeBid(payload.auctionId, payload.bid);
      this.server.to(payload.auctionId).emit('auctionUpdated', updated);
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }
  
} 