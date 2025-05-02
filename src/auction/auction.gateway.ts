import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';

@WebSocketGateway(3008,{})
export class AuctionGateway implements OnGatewayConnection,OnGatewayDisconnect{
  handleDisconnect(client: Socket) {

    this.server.emit('Bidder left',{
      message:` ${client.id} has left the auction`,
    });
  }
  handleConnection(client: Socket) {
client.broadcast.emit('new Bidder',{
  message:` ${client.id} has joined the auction`,
});

  }
@WebSocketServer() server: Server


  @SubscribeMessage('bidPlaced')
  palceNewBit(client:Socket,data: any) {


    console.log( data);
    client.emit('Placed on', data);

    this.server.emit('Placed on', data);
  }
} 