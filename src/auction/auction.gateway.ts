import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';


@WebSocketGateway(3008,{})
export class AuctionGateway {
  @SubscribeMessage('bidPlaced')
  palceNewBit(@MessageBody() data:any){
    console.log('Bid placed:', data);
  }
} 