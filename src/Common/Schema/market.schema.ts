import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
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
  
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] })
products: mongoose.Types.ObjectId[];


  @Prop({ type: String, required: true, enum: MarketsType })
  marketType: MarketsType;
}

export const MarketSchema = SchemaFactory.createForClass(Markets);

