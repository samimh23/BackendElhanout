import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpStatus, HttpException, Query } from '@nestjs/common';
import { CreateSaleDto , CompleteSaleDto , CreateBidDto } from './dto/create-farm-sale.dto';
import { UpdateSaleDto } from './dto/update-farm-sale.dto';
import { FarmSaleService } from './farm-sale.service';
import { SaleType } from './Schema/farm-sale.schema';


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
  async findAll(@Query('type') type?: SaleType) {
    if (type) {
      return await this.salesService.findByType(type);
    }
    return await this.salesService.findAll();
  }

  // Get all auctions
  @Get('auctions')
  async findAllAuctions() {
    return await this.salesService.findByType(SaleType.AUCTION);
  }

  // Get all normal sales
  @Get('normal')
  async findAllNormalSales() {
    return await this.salesService.findByType(SaleType.NORMAL);
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
 // Complete a sale
 @Patch(':id/complete')
 async completeSale(@Param('id') id: string, @Body() completeSaleDto: CompleteSaleDto) {
   try {
     return await this.salesService.completeSale(id, completeSaleDto.buyerName, completeSaleDto.buyerContact);
   } catch (error) {
     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
   }
 }

 // Cancel a sale
 @Patch(':id/cancel')
 async cancelSale(@Param('id') id: string) {
   try {
     return await this.salesService.cancelSale(id);
   } catch (error) {
     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
   }
 }

 // Add a bid to an auction
 @Post(':id/bid')
 async addBid(@Param('id') id: string, @Body() createBidDto: CreateBidDto) {
   try {
     return await this.salesService.addBid(
       id, 
       createBidDto.bidderName, 
       createBidDto.amount, 
       createBidDto.bidderContact
     );
   } catch (error) {
     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
   }
 }

 // Get all bids for an auction
 @Get(':id/bids')
 async getBids(@Param('id') id: string) {
   try {
     const sale = await this.salesService.findOne(id);
     return sale.bids;
   } catch (error) {
     throw new HttpException(error.message, HttpStatus.NOT_FOUND);
   }
 }
}