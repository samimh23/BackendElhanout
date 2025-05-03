import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema()
export class FarmMarket {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) 
  owner: Types.ObjectId;

  @Prop({ required: true })
  farmName: string;

  @Prop({ required: true })
  farmLocation: string;

  @Prop()
  farmPhone?: string;

  @Prop()
  farmEmail?: string;

  @Prop()
  farmDescription?: string;

  @Prop()
  rate?: string;

  @Prop()
  farmImage?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fsale' }], default: [] })
  sales: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fcrop' }], default: [] })
  crops: Types.ObjectId[];
}

export type FarmMarketDocument = FarmMarket & Document;
export const FarmMarketSchema = SchemaFactory.createForClass(FarmMarket);