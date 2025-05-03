import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmCropDto, ExpenseDto } from './create-farm-crop.dto';




export class UpdateFarmCropDto extends PartialType(CreateFarmCropDto) { }