import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "./Role.enum";
import { Document, Types } from 'mongoose';

@Schema({ discriminatorKey: 'role', timestamps: true })
export class User extends Document {
    @Prop()
    name: string;

    @Prop({ unique: true })
    email: string;

    @Prop({ required: true, unique: true, type: [Number] })
    phonenumbers: number[];

    @Prop({ required: true })
    password: string;

    @Prop()
    cin: number;

    @Prop({ default: Date.now })
    createdat: Date;

    @Prop()
    profilepicture: string;

    @Prop({ required: true, enum: Role })
    role: Role;
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Markets' }], default: []} )
    markets: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);