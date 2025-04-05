import { 
  Controller, Post, Body, Get, Param, Delete, Patch, 
  UseGuards, UploadedFile, UseInterceptors, 
  BadRequestException, NotFoundException, Request
} from '@nestjs/common';
import { MarketService } from './market.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { NormalMarket } from './schema/normal-market.schema';
import { Roles } from 'src/config/decorators/roles.decorators';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { RolesGuard } from 'src/config/guards/role.guard';
import { Role } from 'src/users/Schemas/Role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShareFractionDto } from './dto/ShareFraction.dto';
import * as Multer from 'multer';
import { multerConfig } from 'src/config/multer.config';

@Controller('normal')
export class MarketController {
  constructor(private readonly normalMarketService: MarketService) {}

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post()
  @UseInterceptors(FileInterceptor('marketImage', multerConfig))
  async create(
    @Body() createNormalMarketDto: CreateMarketDto,
    @UploadedFile() marketImage: Multer.File,
    @Request() req
  ): Promise<NormalMarket> {
    console.log("Creating Market:", createNormalMarketDto.marketName);

    if (!marketImage) {
      throw new BadRequestException("No market image uploaded");
    }

    createNormalMarketDto.marketImage = marketImage.path;
    
    // Extract userId from the authenticated request
    const userId = req.user.userId;
    
    return this.normalMarketService.create(createNormalMarketDto, userId);
  }

  // NEW ENDPOINT: Create NFT for existing market
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post(':id/create-nft')
  async createNFT(
    @Param('id') id: string,
    @Request() req
  ): Promise<NormalMarket> {
    console.log("Creating NFT for Market ID:", id);
    
    // Extract userId from the authenticated request
    const userId = req.user.userId;
    
    try {
      const updatedMarket = await this.normalMarketService.createTokenForExistingMarket(id, userId);
      return updatedMarket;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create NFT: ${error.message}`);
    }
  }

  @Get()
  async findAll(): Promise<NormalMarket[]> {
    return this.normalMarketService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<NormalMarket> {
    const market = await this.normalMarketService.findOne(id);
    if (!market) {
      throw new NotFoundException(`Market with id ${id} not found`);
    }
    return market;
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('marketImage', multerConfig))
  async update(
    @Param('id') id: string,
    @Body() updateNormalMarketDto: UpdateMarketDto,
    @UploadedFile() marketImage: Multer.File,
    @Request() req
  ): Promise<NormalMarket> {
    console.log("Updating Market ID:", id);
    
    // Extract userId from the authenticated request
    const userId = req.user.userId;
    
    // First check if market exists
    const existingMarket = await this.normalMarketService.findOne(id);
    if (!existingMarket) {
      throw new NotFoundException(`Market with id ${id} not found`);
    }

    if (marketImage) {
      console.log("✅ New image uploaded:", marketImage.path);
      updateNormalMarketDto.marketImage = marketImage.path;
    }

    return this.normalMarketService.update(id, updateNormalMarketDto, userId);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req
  ): Promise<NormalMarket> {
    console.log("Deleting Market ID:", id);
    
    // Extract userId from the authenticated request
    const userId = req.user.userId;
    
    // First check if market exists
    const existingMarket = await this.normalMarketService.findOne(id);
    if (!existingMarket) {
      throw new NotFoundException(`Market with id ${id} not found`);
    }
    
    return this.normalMarketService.remove(id, userId);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post(':id/share')
  async shareFractions(
    @Param('id') id: string,
    @Body() shareData: ShareFractionDto,
    @Request() req
  ) {
    // Extract userId from the authenticated request
    const userId = req.user.userId;
    
    // Use normalMarketService instead of marketService
    return this.normalMarketService.shareFractionalNFT(id, shareData, userId);
  }
}