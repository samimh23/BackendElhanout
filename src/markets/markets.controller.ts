import { Controller, Post, Get, Param, Put, Delete, Body, HttpException, HttpStatus, Logger, Patch } from '@nestjs/common';
import { MarketService } from './markets.service';
import { Market, MarketType } from './schemas/market.schema';

@Controller('markets')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(private readonly marketService: MarketService) {}

  @Post()
  async createMarket(@Body() createMarketDto: any): Promise<Market> {
    try {
      return await this.marketService.createMarket(createMarketDto);
    } catch (error) {
      this.logger.error(`Error creating market: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getAllMarkets(): Promise<Market[]> {
    return this.marketService.getAllMarkets();
  }

  @Get(':id')
  async getMarketById(@Param('id') id: string): Promise<Market> {
    return this.marketService.getMarketById(id);
  }

  @Get('/type/:marketType')
  async getAllMarketsByType(@Param('marketType') marketType: MarketType): Promise<Market[]> {
    return this.marketService.getAllMarketsByType(marketType);
  }


  @Patch(':id')
  async updateMarket(@Param('id') id: string, @Body() updateMarketDto: any): Promise<Market> {
    return this.marketService.updateMarket(id, updateMarketDto);
  }


  @Delete(':id')
  async deleteMarket(@Param('id') id: string): Promise<void> {
    return this.marketService.deleteMarket(id);
  }
}
