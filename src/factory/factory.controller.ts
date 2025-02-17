import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { CreateFactoryDto } from './dto/create-factory.dto';

@Controller('factory')
export class FactoryController {
  constructor(private readonly factoryService: FactoryService) {}

  @Post()
  create(@Body() createFactoryDto: CreateFactoryDto) {
    return this.factoryService.createMarket(createFactoryDto);
  }

  @Get()
  findAll() {
    return this.factoryService.getAllMarkets();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.factoryService.getMarketById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() CreateFactoryDto: CreateFactoryDto) {
    return this.factoryService.updateMarket(id, CreateFactoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.factoryService.deleteMarket(id);
  }
}
