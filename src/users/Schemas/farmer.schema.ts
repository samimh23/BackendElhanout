import { Schema, SchemaFactory } from "@nestjs/mongoose";
import { BusinessOwner } from "./bussinesowner.schema";

@Schema()
export class Farmer extends BusinessOwner{
    

}

export const FarmerShcema =SchemaFactory.createForClass(Farmer)