import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';

export class Merchant extends User {
    @Prop({required: true})
    patentimage:string
    @Prop()
    companyname: string;
    @Prop()
    companyaddress: string;m
    @Prop()
    companyphone: string;
    @Prop()
    companyemail: string;
    @Prop()
    companylogo: string;
    @Prop()
    companydescription: string;
    
}

export const MerchantSchema= SchemaFactory.createForClass(Merchant);