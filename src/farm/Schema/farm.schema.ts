import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Markets, MarketsDocument } from 'src/Common/Schema/market.schema';
@Schema()
export class FarmMarket extends Markets {
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
  marketImage?: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fproduct' }], default: [] })
  Sale: Types.ObjectId[];
}

export type FarmMarketDocument = FarmMarket & Document;
export const FarmMarketSchema = SchemaFactory.createForClass(FarmMarket);