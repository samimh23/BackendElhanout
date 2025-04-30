import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Auction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Crop', required: true })
  cropId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  farmerId: Types.ObjectId;

  @Prop([
    {
      bidderId: { type: Types.ObjectId, ref: 'User', required: true },
      bidAmount: { type: Number, required: true },
      bidTime: { type: Date, default: Date.now },
    },
  ])
  bids: { bidderId: Types.ObjectId; bidAmount: number; bidTime: Date }[];

  @Prop({ required: true })
  startingPrice: number;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, enum: ['active', 'completed', 'cancelled'], default: 'active' })
  status: 'active' | 'completed' | 'cancelled';
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);