import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class ShareSaleListing {
  @Prop({ type: Types.ObjectId, ref: 'NormalMarket', required: true })
  market: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ required: true })
  sharesForSale: number;

  @Prop({ required: true })
  pricePerShare: number; // in your currency unit, e.g. HBAR

  @Prop({ default: false })
  isSold: boolean;

  @Prop()
  buyer: Types.ObjectId; // set when sold
}

export const ShareSaleListingSchema = SchemaFactory.createForClass(ShareSaleListing);