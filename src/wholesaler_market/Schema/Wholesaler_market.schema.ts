import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import { Markets } from "../../Common/Schema/market.schema";

@Schema()
export class WholesalerMarket extends Markets {
    @Prop({ required: true })
    WholesalerName: string;
    @Prop({ required: true })
    WholesalerLocation: string;
    @Prop()
    WholesalerPhone: string;
  
    @Prop()
    WholesalerEmail: string;
  
    @Prop()
    WholesalerImage: string;
}

export const wholesalerMarketSchema = SchemaFactory.createForClass(WholesalerMarket);
