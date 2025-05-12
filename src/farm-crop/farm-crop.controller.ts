import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UploadedFile, BadRequestException, Res, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FarmCropService } from './farm-crop.service';
import { FarmCrop } from './Schema/farm-crop.schema';
import { CreateFarmCropDto } from './dto/create-farm-crop.dto';
import { UpdateFarmCropDto } from './dto/update-farm-crop.dto';
import { Response } from 'express';
import { join } from 'path';
import { Roles } from 'src/config/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { RolesGuard } from 'src/config/guards/role.guard';
import { Role } from 'src/users/Schemas/Role.enum';
import { farmCropMulterConfig } from 'src/config/mutler/multer_farmCrop.config';
import { Multer } from 'multer';


@Controller('farm-crops')
export class FarmCropController {
  constructor(
    private readonly farmCropService: FarmCropService,
  ) {}

  @Post()
  @UseGuards(RolesGuard, AuthenticationGuard)
  @Roles(Role.Farmer)
  create(@Body() createFarmCropDto: CreateFarmCropDto): Promise<FarmCrop> {
    return this.farmCropService.create(createFarmCropDto);
  }

  @Get()
  findAll(): Promise<FarmCrop[]> {
    return this.farmCropService.findAll();
  }

  @Get('farm/:farmMarketId')
  findByFarmId(@Param('farmMarketId') farmMarketId: string): Promise<FarmCrop[]> {
    return this.farmCropService.findByFarmId(farmMarketId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<FarmCrop> {
    return this.farmCropService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard, AuthenticationGuard)
  @Roles(Role.Farmer)
  update(@Param('id') id: string, @Body() updateFarmCropDto: UpdateFarmCropDto): Promise<FarmCrop> {
    return this.farmCropService.update(id, updateFarmCropDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, AuthenticationGuard)
  @Roles(Role.Farmer)
  delete(@Param('id') id: string): Promise<FarmCrop> {
    return this.farmCropService.delete(id);
  }

  @Post(':id/upload-picture')
  @UseGuards(RolesGuard, AuthenticationGuard)
  @Roles(Role.Farmer)
  @UseInterceptors(FileInterceptor('image', farmCropMulterConfig))
  async uploadCropPicture(
    @Param('id') id: string,
    @UploadedFile() file: Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Create the file URL
      const fileUrl = `${process.env.API_BASE_URL}/farm-crops/image/${file.filename}`;
      
      // Update the farm crop with the new picture path
      const updatedCrop = await this.farmCropService.update(id, { 
        picture: file.filename 
      });
      
      return {
        message: 'Farm crop picture uploaded successfully',
        crop: updatedCrop,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload crop picture: ${error.message}`);
    }
  }

  

  @Get('image/:path')
  async getCropImage(
    @Param('path') imagePath: string,
    @Res() res: Response,
  ) {
    try {
      const fullPath = join(process.cwd(), 'uploads/farm-crops', imagePath);
      return res.sendFile(fullPath);
    } catch (error) {
      throw new BadRequestException('Image not found');
    }
  }
}