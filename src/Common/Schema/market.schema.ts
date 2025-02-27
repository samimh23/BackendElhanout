import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export enum MarketsType {
    FACTORY = 'factory',
    FARM = 'farm',
    GROCERY = 'grocery',
    NORMAL = 'normal',
  }

export type MarketsDocument = Markets & Document;
@Schema({ discriminatorKey: 'marketType'}) 
export class Markets {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) 
  owner: Types.ObjectId;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  @Prop({ type: String, required: true, enum: MarketsType })
  marketType: MarketsType;
}

export const MarketSchema = SchemaFactory.createForClass(Markets);

