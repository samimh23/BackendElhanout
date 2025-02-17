import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { WholesalerMarketService } from './wholesaler_market.service';
import { CreateWholesalerMarketDto } from './dto/create-wholesaler_market.dto';
import { WholesalerMarket } from './schema/wholesaler_market.schema';

@Controller('wholesaler-market')
export class WholesalerMarketController {
  constructor(private readonly wholesalerMarketService: WholesalerMarketService) {}

  @Post()
  async create(@Body() createWholesalerMarketDto: CreateWholesalerMarketDto): Promise<WholesalerMarket> {
    return this.wholesalerMarketService.create(createWholesalerMarketDto);
  }

  @Get()
  async findAll(): Promise<WholesalerMarket[]> {
    return this.wholesalerMarketService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WholesalerMarket> {
    return this.wholesalerMarketService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWholesalerMarketDto: CreateWholesalerMarketDto,
  ): Promise<WholesalerMarket> {
    return this.wholesalerMarketService.update(id, updateWholesalerMarketDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<WholesalerMarket> {
    return this.wholesalerMarketService.remove(id);
  }
}
