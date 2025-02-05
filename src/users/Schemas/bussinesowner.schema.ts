import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";

export class Bussinesowner extends User{
    @Prop({required: true})
    patentimage:string
    @Prop()
    Activitysector: string;
    
}

export const ClientShcema = SchemaFactory.createForClass(Bussinesowner);