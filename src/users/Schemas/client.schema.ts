import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./User.schema";

@Schema()
export class Client extends User {
    @Prop()
    clientSpecificProp: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);