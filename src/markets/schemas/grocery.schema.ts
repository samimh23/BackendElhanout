import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import { Market } from "./market.schema";

@Schema()
export class GroceryMarket extends Market {
    @Prop({ required: true })
    GroceryName: string;
    @Prop({ required: true })
    GroceryLocation: string;
    @Prop()
    GroceryPhone: string;
  
    @Prop()
    GroceryEmail: string;
  
    @Prop()
    GroceryImage: string;
}

export const GroceryMarketSchema = SchemaFactory.createForClass(GroceryMarket);
