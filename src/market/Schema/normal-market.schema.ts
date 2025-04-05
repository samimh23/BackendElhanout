import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Markets } from "../../Common/Schema/market.schema";
import { Types } from "mongoose";

@Schema()
export class NormalMarket extends Markets {
  @Prop({ required: true })
  marketName: string;

  @Prop({ required: true })
  marketLocation: string;

  @Prop()
  marketPhone: string;

  @Prop()
  marketEmail: string;

  @Prop()
  marketImage: string;

  @Prop({ required: true })
  marketWalletPublicKey: string; // Market's hedera id

  @Prop({ required: true })
  marketWalletSecretKey: string; // Market's hedera secret key (store securely!)

  @Prop({ required: true, default: 100 }) // 100% ownership initially
  fractions: number;

  @Prop()
  fractionalNFTAddress: string;
}

export const NormalMarketSchema = SchemaFactory.createForClass(NormalMarket);
