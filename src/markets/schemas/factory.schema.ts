import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import {  Types } from "mongoose";
import { Market } from "./market.schema";

@Schema()
export class FactoryMarket extends Market {

}

export const FactoryMarketSchema = SchemaFactory.createForClass(FactoryMarket);
