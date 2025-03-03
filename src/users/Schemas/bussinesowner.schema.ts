import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./User.schema";

@Schema()
export class BusinessOwner extends User {
    @Prop()
    patentImage: string;
}

export const BusinessOwnerSchema = SchemaFactory.createForClass(BusinessOwner);