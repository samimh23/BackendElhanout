import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ProductCategory } from "./category.enum";

@Schema()
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: false })
  price: number;
  
  @Prop({
    type: Number,
    required: false,
    default: 0,
  })
  ratingsAverage: number;
  @Prop({
    type: Number,
    required: false,
    default: 0,
  })
  ratingsQuantity: number;

  @Prop({ required: true })
  originalPrice: number; 

  @Prop({ type: String, enum: ProductCategory, required: true })
  category: ProductCategory;

  @Prop({ required: true })
  stock: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String }) // Changed from array to single string
  image: string;          // Changed from images to image (singular)

  @Prop({ type: Number, default: 0 })
  ratings: number;
  

  @Prop({ default: false })
  isDiscounted: boolean;

  @Prop({ default: 0})
  DiscountValue: number;
  
  @Prop({ type: Types.ObjectId, ref: 'NormalMarket', required: true })
  shop: Types.ObjectId;

  @Prop()
  tokenid: string; // Token ID for the product
}

export const ProductSchema = SchemaFactory.createForClass(Product);
