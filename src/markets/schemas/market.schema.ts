import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export enum MarketType {
    FACTORY = 'factory',
    FARMER = 'farmer',
    GROCERY = 'grocery',
    NORMAL = 'normal',
  }
  
export type MarketDocument = Market & Document;
@Schema({ discriminatorKey: 'marketType' }) 
export class Market {
  @Prop({ required: true })
  marketName: string;

  @Prop({ required: true })
  marketLocation: string;

  @Prop() 
  marketOwner: string;

  @Prop()
  marketPhone: string;

  @Prop()
  marketEmail: string;

  @Prop()
  marketImage: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  @Prop({ type: String, required: true, enum: MarketType }) // Use Enum
  marketType: MarketType;
}

export const MarketSchema = SchemaFactory.createForClass(Market);

