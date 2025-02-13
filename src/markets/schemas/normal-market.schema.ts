import { SchemaFactory,Schema } from "@nestjs/mongoose";
import { Market } from "./market.schema";

@Schema()
export class NormalMarket extends Market {}

export const NormalMarketSchema = SchemaFactory.createForClass(NormalMarket);
