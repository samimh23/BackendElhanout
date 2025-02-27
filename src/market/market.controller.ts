import { Controller, Post, Body, Get, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { NormalMarket } from './schema/normal-market.schema';
import { Roles } from 'src/config/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { RolesGuard } from 'src/config/guards/role.guard';
import { Role } from 'src/users/Schemas/Role.enum';

@Controller('normal')
export class MarketController {
  constructor(private readonly normalMarketService: MarketService) {}
  @UseGuards(RolesGuard,AuthenticationGuard)
  @Roles( Role.MERCHANT)
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
  @UseGuards(RolesGuard,AuthenticationGuard)
  @Roles( Role.MERCHANT)
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
