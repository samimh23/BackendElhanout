import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId, ref: 'FarmCrop', required: false, index: true })
  farmCropId: Types.ObjectId;


  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  quantityMin: number;

  @Prop({ required: true, type: Number })
  pricePerUnit: number;

  @Prop({ required: true })
  createdDate?: Date;


  @Prop()
  notes?: string;

}

export type SaleDocument = Sale & Document;
export const SaleSchema = SchemaFactory.createForClass(Sale);