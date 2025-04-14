// analytics.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Analytics extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NormalMarket', required: true, index: true })
  marketId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  customerAge: number;

  @Prop({ required: true })
  customerGender: string;

  @Prop({ required: true })
  purchaseAmount: number;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  season: string;

  @Prop({ type: [{ category: String, amount: Number }], required: true })
  categories: Array<{ category: string; amount: number }>;

  @Prop({ required: true })
  orderDate: Date;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);