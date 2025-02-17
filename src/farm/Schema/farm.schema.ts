import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";
import { Markets } from "../../Common/Schema/market.schema";

@Schema()
export class FarmMarket extends Markets {
  @Prop({ required: true })
  FarmName: string;

  @Prop({ required: true })
  FarmLocation: string;

  @Prop()
  FarmPhone: string;

  @Prop()
  FarmEmail: string;

  @Prop()
  marketImage: string;
}

export const FarmMarketSchema = SchemaFactory.createForClass(FarmMarket);
