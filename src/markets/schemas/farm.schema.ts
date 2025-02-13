import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import {  Types } from "mongoose";
import { Market } from "./market.schema";

@Schema()
export class FarmerMarket extends Market {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Farmer' }], default: [] })
  farmers: Types.ObjectId[];

  @Prop()
  seasonalOnly: boolean; // Example: true if it operates only in certain seasons
}

export const FarmerMarketSchema = SchemaFactory.createForClass(FarmerMarket);
