import { Controller, Post, Body, Get, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { FarmService } from './farm.service';
import { CreateFarmMarketDto } from './dto/create-farm.dto';
import { FarmMarket } from './schema/farm.schema';
import { Roles } from 'src/config/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { RolesGuard } from 'src/config/guards/role.guard';
import { Role } from 'src/users/Schemas/Role.enum';

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
  @UseGuards(RolesGuard,AuthenticationGuard)
  @Roles( Role.Farmer)
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
