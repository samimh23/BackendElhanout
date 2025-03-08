import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AuditStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Schema()
export class Expense {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Number })
  value: number;

  @Prop({ required: true })
  date: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

@Schema({ timestamps: true })
export class FarmCrop {
  @Prop({ type: Types.ObjectId, ref: 'Farm', required: true, index: true })
  farmId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  implantDate: Date;

  @Prop()
  harvestedDay?: Date;

  @Prop({ type: [ExpenseSchema], default: [] })
  expenses: Expense[];

  @Prop({ type: Number })
  quantity?: number;

  @Prop({ type: String, enum: AuditStatus })
  auditStatus?: AuditStatus;

  @Prop()
  auditReport?: string;

  @Prop()
  auditProofImage?: string;

  @Prop()
  picture?: string;
}

export type FarmCropDocument = FarmCrop & Document;
export const FarmCropSchema = SchemaFactory.createForClass(FarmCrop);