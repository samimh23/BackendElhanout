import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import {  Types } from "mongoose";
import { Market } from "./market.schema";

@Schema()
export class FarmMarket extends Market {


}

export const FarmMarketSchema = SchemaFactory.createForClass(FarmMarket);
