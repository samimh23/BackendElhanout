import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class User extends Document {
  @Prop()
  username: string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  age: number;

  @Prop({ default: true })
  isValid: boolean;

  @Prop()
  address: string;

  @Prop()
  phoneNumber: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop()
  imageUrl: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Shop' }] })
  shops: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
