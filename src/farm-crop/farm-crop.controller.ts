import { Controller, Get, Post, Body, Param, Put, Delete, Patch } from '@nestjs/common';
import { FarmCropService } from './farm-crop.service';
import { FarmCrop } from './Schema/farm-crop.schema';
import { CreateFarmCropDto } from './dto/create-farm-crop.dto';
import { UpdateFarmCropDto } from './dto/update-farm-crop.dto';


@Controller('farm-crops')
export class FarmCropController {
  constructor(private readonly farmCropService: FarmCropService) {}

  @Post()
  create(@Body() createFarmCropDto: CreateFarmCropDto): Promise<FarmCrop> {
    return this.farmCropService.create(createFarmCropDto);
  }

  @Get()
  findAll(): Promise<FarmCrop[]> {
    return this.farmCropService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<FarmCrop> {
    return this.farmCropService.findOne(id);
  }

  @Get('farm/:farmMarketId')
  findByFarmId(@Param('farmMarketId') farmMarketId: string): Promise<FarmCrop[]> {
    return this.farmCropService.findByFarmId(farmMarketId);
  }
  


  @Put(':id')
  update(@Param('id') id: string, @Body() updateFarmCropDto: UpdateFarmCropDto): Promise<FarmCrop> {
    return this.farmCropService.update(id, updateFarmCropDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<FarmCrop> {
    return this.farmCropService.delete(id);
  }
}
