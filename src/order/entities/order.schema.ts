import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

@Schema()
export class Order extends Document {
  @Prop({ required: true })
  idOrder: string;

  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shop: Types.ObjectId;
  
  @Prop({ 
    type: [{ productId: { type: Types.ObjectId, ref: 'Product' }, quantity: Number }], 
    required: true 
  })
  products: { productId: Types.ObjectId; quantity: number }[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  iduser: Types.ObjectId;

  @Prop({ default: Date.now })
  dateOrder: Date;

  @Prop({ default: false })
  isconfirmed: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
