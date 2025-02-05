import { Schema,Prop, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "./Role.enum";


@Schema()
export class User extends Document{
    
    @Prop()
    firstname: string;


    @Prop()
    age:number

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

    @Prop()
    adresse:string
    @Prop()
    role:Role
    
    
    
}

export const UserSchema = SchemaFactory.createForClass(User);