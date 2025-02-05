import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";

export class Client extends User{
    @Prop()
    age:number
    @Prop()
    adresse:string
}

export const ClientShcema = SchemaFactory.createForClass(Client);