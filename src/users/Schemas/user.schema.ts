import { Schema,Prop, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "./Role.enum";


@Schema({discriminatorKey:'role',timestamps:true})
export class User extends Document{
    
    @Prop()
    name: string;

    
    @Prop({unique:true})
    email: string;

    @Prop({required: true,unique:true})
    phonenumber: number;

    @Prop({required: true}) 
    password: string;

    @Prop()
    cin: number;

    @Prop({default: Date.now})
    createdat: Date;

    @Prop()
    profilepicture: string;

    
    @Prop({ required: true, enum: Role })
    role:Role
    
    
    
}

export const UserSchema = SchemaFactory.createForClass(User);