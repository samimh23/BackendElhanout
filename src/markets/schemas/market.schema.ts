import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export enum MarketType {
    FACTORY = 'factory',
    FARM = 'farm',
    GROCERY = 'grocery',
    NORMAL = 'normal',
  }
  
export type MarketDocument = Market & Document;
@Schema({ discriminatorKey: 'marketType' }) 
export class Market {
  @Prop() 
  Owner: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  @Prop({ type: String, required: true, enum: MarketType })
  marketType: MarketType;
}

export const MarketSchema = SchemaFactory.createForClass(Market);

