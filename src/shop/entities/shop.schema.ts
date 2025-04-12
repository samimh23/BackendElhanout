import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Shop extends Document {
  @Prop()
  name: string;

  @Prop()
  address: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  products: Types.ObjectId[];

  @Prop({ type: [String] })
  categories: string[];

  @Prop({ type: [String] })
  deliveryOptions: string[];

  @Prop({ type: [String] })
  paymentMethods: string[];

  @Prop({ type: Number, default: 0 })
  ratings: number;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);
