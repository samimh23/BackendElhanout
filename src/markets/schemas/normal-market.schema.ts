import { SchemaFactory,Schema, Prop } from "@nestjs/mongoose";
import { Market } from "./market.schema";

@Schema()
export class NormalMarket extends Market {
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
}

export const NormalMarketSchema = SchemaFactory.createForClass(NormalMarket);
