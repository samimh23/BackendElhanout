import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Bid, BidSchema } from './bid.schema';

export enum SaleType {
  NORMAL = 'normal',
  AUCTION = 'auction',
}

export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}


@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId, ref: 'FarmCrop', required: true, index: true })
  farmCropId: Types.ObjectId;

  @Prop({ required: true, enum: SaleType })
  type: SaleType;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  pricePerUnit: number;

  @Prop({ required: true })
  createdDate: Date;

  @Prop({ required: true, enum: SaleStatus, default: SaleStatus.PENDING })
  status: SaleStatus;

  @Prop()
  completedDate?: Date;

  @Prop()
  buyerName?: string;

  @Prop()
  buyerContact?: string;

  @Prop()
  notes?: string;

  // Auction specific fields
  @Prop()
  auctionStartDate?: Date;

  @Prop()
  auctionEndDate?: Date;

  @Prop({ type: Number })
  startingBid?: number;

  @Prop({ type: Number })
  currentBid?: number;

  @Prop()
  currentBidder?: string;

  @Prop({ type: [BidSchema], default: [] })
  bids: Bid[];
}

export type SaleDocument = Sale & Document;
export const SaleSchema = SchemaFactory.createForClass(Sale);