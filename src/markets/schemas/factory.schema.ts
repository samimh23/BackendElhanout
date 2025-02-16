import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import {  Types } from "mongoose";
import { Market } from "./market.schema";

@Schema()
export class FactoryMarket extends Market {
    @Prop({ required: true })
    FactoryName: string;
    FactoryLocation: string;
    @Prop()
    FactoryPhone: string;

    @Prop()
    FactoryEmail: string;

    @Prop()
    FactoryImage: string;
}

export const FactoryMarketSchema = SchemaFactory.createForClass(FactoryMarket);
