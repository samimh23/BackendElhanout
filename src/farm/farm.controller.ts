import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { FarmService } from './farm.service';
import { CreateFarmMarketDto } from './dto/create-farm.dto';
import { FarmMarket } from './schema/farm.schema';

@Controller('farm')
export class FarmController {
  constructor(private readonly farmMarketService: FarmService) {}

  @Post()
  async create(@Body() createFarmMarketDto: CreateFarmMarketDto): Promise<FarmMarket> {
    return this.farmMarketService.create(createFarmMarketDto);
  }

  @Get()
  async findAll(): Promise<FarmMarket[]> {
    return this.farmMarketService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FarmMarket> {
    return this.farmMarketService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() CreateFarmMarketDto: CreateFarmMarketDto,
  ): Promise<FarmMarket> {
    return this.farmMarketService.update(id, CreateFarmMarketDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<FarmMarket> {
    return this.farmMarketService.remove(id);
  }
}
