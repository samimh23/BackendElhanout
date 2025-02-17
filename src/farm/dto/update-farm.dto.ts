import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmMarketDto } from './create-farm.dto';

export class UpdateFarmDto extends PartialType(CreateFarmMarketDto) {}
