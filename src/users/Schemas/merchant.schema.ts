import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { BusinessOwner } from "./bussinesowner.schema";

@Schema()
export class Merchant extends BusinessOwner {
    @Prop()
    merchantSpecificProp: string;
}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);