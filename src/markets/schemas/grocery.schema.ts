import { Prop, SchemaFactory ,Schema} from "@nestjs/mongoose";
import { Market } from "./market.schema";

@Schema()
export class GroceryMarket extends Market {
   
}

export const GroceryMarketSchema = SchemaFactory.createForClass(GroceryMarket);
