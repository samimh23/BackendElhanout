import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "./Role.enum";
import { Document } from 'mongoose';

@Schema({ discriminatorKey: 'role', timestamps: true })
export class User extends Document {
    @Prop()
    firstName?: string;

    @Prop()
    lastName?: string;

    @Prop({ unique: true })
    email: string;

    @Prop({ unique: true, type: [Number] })
    phonenumbers?: number[];

    @Prop({ required: true })
    password?: string;

    @Prop()
    cin?: number;

    @Prop({ default: Date.now })
    createdat: Date;

    @Prop()
    profilepicture?: string;

    @Prop({ default: 'local' })
    provider: string;


    @Prop({ required: true, enum: Role })
    role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);