import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpStatus, HttpException, Query } from '@nestjs/common';
import { CreateSaleDto  } from './dto/create-farm-sale.dto';
import { UpdateSaleDto } from './dto/update-farm-sale.dto';
import { FarmSaleService } from './farm-sale.service';


@Controller('farm-sales')
export class FarmSaleController {
  constructor(private readonly salesService: FarmSaleService) {}

  @Post()
  async create(@Body() createSaleDto: CreateSaleDto) {
    try {
      return await this.salesService.create(createSaleDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    try {
    return await this.salesService.findAll();
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.salesService.findOne(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }


  @Get('crop/:cropId')
  async getSalesByCropId(@Param('cropId') cropId: string) {
    try {
      return await this.salesService.getSalesByCropId(cropId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    try {
      return await this.salesService.update(id, updateSaleDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.salesService.remove(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }


 // Cancel a sale
 @Patch(':id/cancel')
 async cancelSale(@Param('id') id: string) {
   try {
   //  return await this.salesService.cancelSale(id);
   } catch (error) {
     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
   }
 }
}