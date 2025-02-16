import { Controller, Post, Get, Param, Put, Delete, Body, HttpException, HttpStatus, Logger, Patch } from '@nestjs/common';
import { MarketService } from './markets.service';
import { Market, MarketType } from './schemas/market.schema';
import { CreateMarketDto } from './dto/create-market.dto';

@Controller('markets')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(private readonly marketService: MarketService) {}

  @Post()
  async createMarket(@Body() createMarketDto: CreateMarketDto): Promise<Market> {
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

  @Get(':id/:marketType')
  async getMarketById(@Param('id') id: string, @Param('marketType') marketType: MarketType): Promise<Market> {
    try {
      return await this.marketService.getMarketById(id, marketType);
    } catch (error) {
      this.logger.error(`Error fetching market: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('/type/:marketType')
  async getAllMarketsByType(@Param('marketType') marketType: MarketType): Promise<Market[]> {
    return this.marketService.getAllMarketsByType(marketType);
  }

  @Patch(':id/:marketType')
  async updateMarket(@Param('id') id: string, @Param('marketType') marketType: MarketType, @Body() updateMarketDto: any): Promise<Market> {
    try {
      return await this.marketService.updateMarket(id, marketType, updateMarketDto);
    } catch (error) {
      this.logger.error(`Error updating market: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id/:marketType')
  async deleteMarket(@Param('id') id: string, @Param('marketType') marketType: MarketType): Promise<void> {
    try {
      return await this.marketService.deleteMarket(id, marketType);
    } catch (error) {
      this.logger.error(`Error deleting market: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}