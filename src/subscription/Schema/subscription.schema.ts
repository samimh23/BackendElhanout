import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes } from 'mongoose';
import { Role } from "src/users/Schemas/Role.enum";
import { SubscriptionStatus } from "../Enum/SubscriptionStatus.enum";


@Schema({ timestamps: true })
export class Subscription extends Document {
    @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ required: true, enum: [Role.WHOLESALER, Role.Farmer], default: Role.Farmer })
    roleSubscribed: Role;

    @Prop({ required: true, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop()
    paymentId?: string;

    @Prop()
    cancelledAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);