import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

@Schema()
export class Reservation extends Document {

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;
  
  @Prop({ required: true, default: 1 })
  quantity: number;  // The quantity the user wants to reserve
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ required: true })
  pickupDate: Date;

  @Prop({ required: true })
  pickupTime: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'pending' 
  })
  status: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);