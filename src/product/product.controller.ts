import { 
  Controller, Post, Body, Param, Delete, UseInterceptors, 
  UploadedFile, Get, Patch, HttpException, HttpStatus, Req 
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/mutler/mutler_prod.config'; 
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image: any,
    @Req() req: Request
  ) {
    console.log('Original Create Product DTO:', JSON.stringify(createProductDto));
 
    try {
      // Convert string values to appropriate types
      createProductDto.originalPrice = typeof createProductDto.originalPrice === 'string' 
        ? parseFloat(createProductDto.originalPrice) 
        : createProductDto.originalPrice;

      createProductDto.stock = typeof createProductDto.stock === 'string' 
        ? parseInt(createProductDto.stock, 10) 
        : createProductDto.stock;
      
      // Process uploaded file if it exists (from multipart form)
      if (image) {
        console.log('Received image file:', image.path);
        createProductDto.image = image.path;
      } 
      // Check for base64 image in the request body
      else if (createProductDto.image && (createProductDto.image.startsWith('data:image') || 
               /^[A-Za-z0-9+/=]+$/.test(createProductDto.image))) {
        // Extract base64 data - handle both with and without the data:image prefix
        let base64Data = createProductDto.image;
        let fileExtension = '.jpg'; // Default extension
        
        if (base64Data.startsWith('data:image')) {
          const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            base64Data = matches[2];
            fileExtension = mimeType === 'jpeg' || mimeType === 'jpg' ? '.jpg' : 
                          mimeType === 'png' ? '.png' : 
                          mimeType === 'gif' ? '.gif' : '.jpg';
          }
        }
        
        // Create filename using product name
        const productName = createProductDto.name || 'product';
        const cleanName = productName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .substring(0, 50);
          
        // Ensure the directory exists
        const uploadsDir = './uploads/product';
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Create unique filename
        let filename = `${cleanName}${fileExtension}`;
        let counter = 1;
        
        while (fs.existsSync(path.join(uploadsDir, filename))) {
          filename = `${cleanName}_${counter}${fileExtension}`;
          counter++;
        }
        
        const filePath = path.join(uploadsDir, filename);
        
        // Write the file
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        console.log('Saved base64 image to:', filePath);
        
        // Set the path in the DTO
        createProductDto.image = `uploads/product/${filename}`;
      }
      
      // Process networkImage field if it exists (for an existing image URL)
      const networkImage = req.body.networkImage;
      if (networkImage && !createProductDto.image) {
        try {
          // If networkImage is a string path, use it directly
          createProductDto.image = networkImage;
          console.log('Using network image:', createProductDto.image);
        } catch (e) {
          console.error('Error processing networkImage:', e);
        }
      }

      console.log('Processed Create Product DTO:', JSON.stringify(createProductDto));
      return await this.productService.create(createProductDto);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image: any,
    @Req() req: Request
  ) {
    try {
      console.log('Received update DTO:', JSON.stringify(updateProductDto));
      
      // Create a clean update data object
      const updateData = {};
      
      // Copy over all the properties from updateProductDto that are defined
      // The @Transform decorators in the DTO have already handled type conversions
      for (const key in updateProductDto) {
        if (updateProductDto[key] !== undefined && key !== 'networkImage') {
          updateData[key] = updateProductDto[key];
        }
      }
      
      // Process uploaded file if it exists (from multipart form)
      if (image) {
        console.log('Received image file:', image.path);
        updateData['image'] = image.path;
      } 
      // Check for base64 image in the request body
      else if (updateProductDto.image && (updateProductDto.image.startsWith('data:image') || 
              /^[A-Za-z0-9+/=]+$/.test(updateProductDto.image))) {
        // Extract base64 data - handle both with and without the data:image prefix
        let base64Data = updateProductDto.image;
        let fileExtension = '.jpg'; // Default extension
        
        if (base64Data.startsWith('data:image')) {
          // Extract mime type and base64 content
          const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            base64Data = matches[2];
            fileExtension = mimeType === 'jpeg' || mimeType === 'jpg' ? '.jpg' : 
                          mimeType === 'png' ? '.png' : 
                          mimeType === 'gif' ? '.gif' : '.jpg';
          }
        }
        
        // Get the current product to use its name if available
        const currentProduct = await this.productService.findOne(id);
        
        // Create filename using product name
        const productName = updateData['name'] || (currentProduct ? currentProduct.name : 'product');
        const cleanName = productName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .substring(0, 50);
          
        // Ensure the directory exists
        const uploadsDir = './uploads/product';
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Create unique filename
        let filename = `${cleanName}${fileExtension}`;
        let counter = 1;
        
        while (fs.existsSync(path.join(uploadsDir, filename))) {
          filename = `${cleanName}_${counter}${fileExtension}`;
          counter++;
        }
        
        const filePath = path.join(uploadsDir, filename);
        
        // Write the file
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        console.log('Saved updated base64 image to:', filePath);
        
        // Set the path in the update data
        updateData['image'] = `uploads/product/${filename}`;
      }
      
      // Process networkImage field if it exists and no new image was uploaded
      const networkImage = req.body.networkImage || updateProductDto.networkImage;
      if (networkImage && !image && !updateData['image']) {
        updateData['image'] = networkImage;
        console.log('Using network image for update:', updateData['image']);
      }
      
      console.log('Final update data to be sent to service:', JSON.stringify(updateData));
      
      // Call the service to update the product with the clean data object
      return this.productService.update(id, updateData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
  @Get('search/:name')
  findProductsByName(@Param('name') name: string) {
    return this.productService.findProductsByName(name);
  }

  @Patch('discount/:id')
  async discountProduct(
    @Param('id') productId: string,
    @Body('discountPercentage') discountPercentage: number,
  ) {
    return this.productService.discountProduct(productId, discountPercentage);
  }

  @Delete(':id/discount')
  removeDiscount(@Param('id') id: string) {
    return this.productService.removeDiscount(id);
  }

  @Get('/discounted/all')
  getDiscountedProducts() {
    return this.productService.getDiscountedProduct();
  }
}
