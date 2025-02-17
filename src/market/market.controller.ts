import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { MarketService } from './market.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { NormalMarket } from './schema/normal-market.schema';

@Controller('normal')
export class MarketController {
  constructor(private readonly normalMarketService: MarketService) {}

  @Post()
  async create(@Body() createNormalMarketDto: CreateMarketDto): Promise<NormalMarket> {
    return this.normalMarketService.create(createNormalMarketDto);
  }

  @Get()
  async findAll(): Promise<NormalMarket[]> {
    return this.normalMarketService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<NormalMarket> {
    return this.normalMarketService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNormalMarketDto: CreateMarketDto,
  ): Promise<NormalMarket> {
    return this.normalMarketService.update(id, updateNormalMarketDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<NormalMarket> {
    return this.normalMarketService.remove(id);
  }
}
