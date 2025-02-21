import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }
  @Get('discounts')
  async getDiscountedProduct() {
     return this.productService.getDiscountedProduct();
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
  @Get('search/:name')
  findProductsByName(@Param('name') name: string) {
    return this.productService.findProductsByName(name);
  }

  @Patch('removeDiscount/:id')
  removeDiscountedProduct(@Param('id') id: string) {
    return this.productService.removeDiscount(id);
  }

  @Patch('discount/:id')
  async discountProduct(
    @Param('id') productId: string,
    @Body('discountPercentage') discountPercentage: number,
  ) {
    return this.productService.discountProduct(productId, discountPercentage);
  }

  

}
