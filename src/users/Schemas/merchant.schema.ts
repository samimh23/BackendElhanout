import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Bussinesowner } from './bussinesowner.schema';

export class Merchant extends Bussinesowner {
    
    @Prop()
    merchantname: string;
    @Prop()
    merchantaddress: string;    
    
    
    
}

export const MerchantSchema= SchemaFactory.createForClass(Merchant);