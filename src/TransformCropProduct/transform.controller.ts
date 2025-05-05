import { Controller, Post, Param, Body, Get, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FarmCropToProductService } from './transform.service';
import { AuditStatus, FarmCrop, FarmCropDocument } from 'src/farm-crop/Schema/farm-crop.schema';

@Controller('farm-crops')
export class FarmCropToProductController {
  private readonly logger = new Logger(FarmCropToProductController.name);

  constructor(
    private readonly farmCropToProductService: FarmCropToProductService,
    @InjectModel(FarmCrop.name) private farmCropModel: Model<FarmCropDocument>,
  ) {}

  @Post(':id/convert-to-product')
  async convertToProduct(@Param('id') id: string) {
    // Find the farm crop
    const farmCrop = await this.farmCropModel.findById(id);
    
    if (!farmCrop) {
      throw new NotFoundException(`FarmCrop with ID ${id} not found`);
    }
    
    // Check if it's confirmed
    if (farmCrop.auditStatus !== AuditStatus.CONFIRMED) {
      throw new NotFoundException(`FarmCrop with ID ${id} is not confirmed yet`);
    }
    
    // Process the farm crop to product conversion
    const product = await this.farmCropToProductService.manualProcessFarmCrop(id);
    
    if (!product) {
      throw new NotFoundException(`Failed to convert FarmCrop with ID ${id} to product`);
    }
    
    return { 
      message: 'FarmCrop successfully converted to product',
      product
    };
  }

  @Post(':id/confirm-and-convert')
  async confirmAndConvert(@Param('id') id: string, @Body() auditData: { auditReport: string }) {
    // Find the farm crop
    const farmCrop = await this.farmCropModel.findById(id);
    
    if (!farmCrop) {
      throw new NotFoundException(`FarmCrop with ID ${id} not found`);
    }
    
    // Update the farm crop to confirmed status
    farmCrop.auditStatus = AuditStatus.CONFIRMED;
    farmCrop.auditReport = auditData.auditReport;
    await farmCrop.save();
    
    this.logger.log(`FarmCrop ${id} confirmed successfully`);
    
    // Process the farm crop to product conversion
    const product = await this.farmCropToProductService.manualProcessFarmCrop(id);
    
    if (!product) {
      throw new NotFoundException(`Failed to convert FarmCrop with ID ${id} to product`);
    }
    
    return { 
      message: 'FarmCrop confirmed and converted to product successfully',
      product
    };
  }

  @Post('process-confirmed')
  async processAllConfirmed() {
    const processedCount = await this.farmCropToProductService.processAllConfirmedFarmCrops();
    return { 
      message: 'Processing of confirmed farm crops completed',
      processedCount
    };
  }
}