import { 
  Controller, Post, Body, Get, Param, Delete, Patch, 
  UseGuards, UploadedFile, UseInterceptors, 
  BadRequestException, NotFoundException, Request,
  ForbiddenException
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

// Import sale listing schema and DTO if needed
import { ShareSaleListing } from './schema/ShareSaleListing.schema';

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
    const userId = req.user.userId;
    return this.normalMarketService.create(createNormalMarketDto, userId);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post(':id/create-nft')
  async createNFT(
    @Param('id') id: string,
    @Request() req
  ): Promise<NormalMarket> {
    console.log("Creating NFT for Market ID:", id);
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

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post(':id/share')
  async shareFractions(
    @Param('id') id: string,
    @Body() shareData: ShareFractionDto,
    @Request() req
  ) {
    const userId = req.user.userId;
    return this.normalMarketService.shareFractionalNFT(id, shareData, userId);
  }

  @Get()
  async findAll(): Promise<NormalMarket[]> {
    return this.normalMarketService.findAll();
  }

  @UseGuards(AuthenticationGuard)
  @Get('my-markets')
  async getMyMarkets(@Request() req): Promise<NormalMarket[]> {
    const userId = req.user._id || req.user.id;
    console.log(`Fetching markets for authenticated user ID: ${userId}`);
    return this.normalMarketService.getMarketsByOwner(userId);
  }

  // --- Place specific routes before ":id" route to avoid ObjectId cast errors ---
  @Get('shares-for-sale')
  async getAllSharesOnSale(): Promise<ShareSaleListing[]> {
    return this.normalMarketService.getAllSharesOnSale();
  }

@Post('buy-shares/:listingId')
  @UseGuards(AuthenticationGuard)
async buyShares(
  @Param('listingId') listingId: string,
  @Body('amountPaid') amountPaid: number,
  @Request() req: any
): Promise<any> {
  const userId = req.user._id || req.user.id || req.user.userId;
  if (!userId) throw new ForbiddenException('No user id provided');
  return this.normalMarketService.buyShares(listingId, userId, amountPaid);
}

  // --- All routes with variable ":id" go after specific ones ---
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
    const userId = req.user.userId;
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
@Patch('shares-for-sale/:id')
@UseGuards(AuthenticationGuard, RolesGuard)
@Roles(Role.MERCHANT)
async updateShareSaleListing(
  @Param('id') id: string,
  @Body() updateData: any,
  @Request() req
) {
  const userId = req.user.userId;
  const updated = await this.normalMarketService.updateListing(id, updateData, userId);
  if (!updated) throw new NotFoundException('Listing not found or not authorized');
  return updated;
}
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req
  ): Promise<NormalMarket> {
    console.log("Deleting Market ID:", id);
    const userId = req.user.userId;
    const existingMarket = await this.normalMarketService.findOne(id);
    if (!existingMarket) {
      throw new NotFoundException(`Market with id ${id} not found`);
    }
    return this.normalMarketService.remove(id, userId);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post(':id/transfer-tokens')
  async transferTokensToOwner(
    @Param('id') marketId: string,
    @Body() body: { amount: number },
    @Request() req
  ) {
    const userId = req.user.userId;
    return this.normalMarketService.transferTokensToOwner(marketId, body.amount, userId);
  }

  // Owner puts shares on sale (listing)
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post(':id/list-shares-for-sale')
  async listSharesForSale(
    @Param('id') marketId: string,
    @Body('shares') shares: number,
    @Body('pricePerShare') pricePerShare: number,
    @Request() req: any
  ): Promise<ShareSaleListing> {
    if (!shares || !pricePerShare) throw new BadRequestException('shares and pricePerShare are required');
    return this.normalMarketService.listSharesForSale(marketId, req.user.userId, shares, pricePerShare);
  }

@UseGuards(AuthenticationGuard, RolesGuard)
@Delete('shares-for-sale/:id')
async deleteShareSaleListing(
  @Param('id') id: string,
  @Request() req
): Promise<{ message: string, sharesReturned: number }> {
  console.log('req.user:', req.user); // <-- Add this line
  const userId = req.user.userId || req.user.id || req.user._id;
  if (!userId) throw new ForbiddenException('No user id provided');
  const result = await this.normalMarketService.deleteListing(id, userId);
  if (!result.deleted) throw new NotFoundException('Listing not found or not authorized');
  return {
    message: 'Listing deleted successfully',
    sharesReturned: result.sharesReturned,
  };
}
}