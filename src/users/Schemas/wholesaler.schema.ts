import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { BusinessOwner } from "./bussinesowner.schema";

@Schema()
export class Wholesaler extends BusinessOwner {
    @Prop()
    wholesalerSpecificProp: string;
}

export const WholesalerSchema = SchemaFactory.createForClass(Wholesaler);