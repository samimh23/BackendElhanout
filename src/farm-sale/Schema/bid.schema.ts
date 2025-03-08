import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';

@Schema()
export class Bid {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  bidderName: string;

  @Prop()
  bidderContact?: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true })
  bidTime: Date;
}

export const BidSchema = SchemaFactory.createForClass(Bid);
