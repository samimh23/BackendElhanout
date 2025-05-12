import { Controller, Post, Body, Get, Param, Delete, Patch, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FarmService } from './farm.service';
import { CreateFarmMarketDto } from './dto/create-farm.dto';
import { FarmMarket } from './schema/farm.schema';
import { Roles } from 'src/config/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { RolesGuard } from 'src/config/guards/role.guard';
import { Role } from 'src/users/Schemas/Role.enum';
import { Response } from 'express';
import { join } from 'path';
import { diskStorage } from 'multer';
import * as Multer from 'multer';
import { farmMulterConfig } from 'src/config/mutler/multer_farm.config';

@Controller('farm')
export class FarmController {
  constructor(
    private readonly farmMarketService: FarmService,
  ) {}

  @Post()
  async create(@Body() createFarmMarketDto: CreateFarmMarketDto): Promise<FarmMarket> {
    return this.farmMarketService.create(createFarmMarketDto);
  }

  @Get()
  async findAll(): Promise<FarmMarket[]> {
    return this.farmMarketService.findAll();
  }

  @Get('farmer/:owner')
  async findAllByFarmerId(@Param('owner') owner: string): Promise<FarmMarket[]> {
    return this.farmMarketService.findByFarmerId(owner);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FarmMarket> {
    return this.farmMarketService.findOne(id);
  }

  @Get(':id/products')
  async getFarmProducts(@Param('id') id: string) {
    return this.farmMarketService.getFarmProducts(id);
  }
  
  @UseGuards(RolesGuard, AuthenticationGuard)
  @Roles(Role.Farmer)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() createFarmMarketDto: CreateFarmMarketDto,
  ): Promise<FarmMarket> {
    return this.farmMarketService.update(id, createFarmMarketDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<FarmMarket> {
    return this.farmMarketService.remove(id);
  }

  @Post(':id/upload-image')
  @UseGuards(RolesGuard, AuthenticationGuard)
  @Roles(Role.Farmer)
  @UseInterceptors(FileInterceptor('farmImage', farmMulterConfig))
  async uploadFarmImage(
    @Param('id') id: string,
    @UploadedFile() file: Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Create the file URL
      const fileUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/farm/image/${file.filename}`;
      
      // Update farm with new image path
      const updatedFarm = await this.farmMarketService.update(id, { 
        farmImage: file.filename 
      } as CreateFarmMarketDto);    

      return {
        message: 'Farm image uploaded successfully',
        farm: updatedFarm,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  @Get('image/:path')
  async getFarmImage(
    @Param('path') imagePath: string,
    @Res() res: Response,
  ) {
    try {
      const fullPath = join(process.cwd(), 'uploads/farm', imagePath);
      return res.sendFile(fullPath);
    } catch (error) {
      throw new BadRequestException('Image not found');
    }
  }

}