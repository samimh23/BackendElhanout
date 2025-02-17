import { PartialType } from '@nestjs/mapped-types';
import { CreateWholesalerMarketDto } from './create-wholesaler_market.dto';

export class UpdateWholesalerMarketDto extends PartialType(CreateWholesalerMarketDto) {}
