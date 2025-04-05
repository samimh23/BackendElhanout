import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, 
  UploadedFiles, UseInterceptors, BadRequestException, UploadedFile } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/mutler/mutler_prod.config';

// Define our own interface for Multer files to avoid TypeScript errors
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: MulterFile[] // Use our custom interface
  ) {
    try {
      // Generate URLs for the uploaded images
      const imageUrls = files ? files.map(file => `${process.env.API_URL || 'http://localhost:3000'}/uploads/products/${file.filename}`) : [];
      
      // Add the image URLs to the DTO
      const productWithImages = {
        ...createProductDto,
        images: imageUrls,
      };
      
      return this.productService.create(productWithImages);
    } catch (error) {
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
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
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: MulterFile[] // Use our custom interface
  ) {
    try {
      let updatedData: any = { ...updateProductDto };
      
      // Convert form data values from string to appropriate types
      if (updateProductDto.price !== undefined) {
        updatedData.price = parseFloat(updateProductDto.price.toString());
      }
      if (updateProductDto.originalPrice !== undefined) {
        updatedData.originalPrice = parseFloat(updateProductDto.originalPrice.toString());
      }
      if (updateProductDto.stock !== undefined) {
        updatedData.stock = parseInt(updateProductDto.stock.toString(), 10);
      }
      if (updateProductDto.isDiscounted !== undefined) {
        updatedData.isDiscounted = updateProductDto.isDiscounted === true || 
                                 updateProductDto.isDiscounted === 'true';
      }
      if (updateProductDto.DiscountValue !== undefined) {
        updatedData.DiscountValue = parseFloat(updateProductDto.DiscountValue.toString());
      }
      
      // Process images
      if (files && files.length > 0) {
        // Generate URLs for the newly uploaded images
        const newImageUrls = files.map(file => 
          `${process.env.API_URL || 'http://localhost:3000'}/uploads/products/${file.filename}`
        );
        
        // If we should keep existing images
        if (updateProductDto.keepExistingImages === 'true') {
          // Get current product to access its existing images
          const currentProduct = await this.productService.findOne(id);
          
          // Combine existing and new image URLs
          // Handle if existingImages comes as a string from form data
          let existingImages = updateProductDto.existingImages || [];
          if (typeof existingImages === 'string') {
            try {
              existingImages = JSON.parse(existingImages);
            } catch (e) {
              existingImages = [existingImages as string]; // Ensure it's treated as a string
            }
          }
          
          updatedData.images = [...existingImages, ...newImageUrls];
        } else {
          // Replace with only new images
          updatedData.images = newImageUrls;
        }
      } else if (updateProductDto.existingImages) {
        // No new uploads but existingImages were specified in the form
        let existingImages = updateProductDto.existingImages;
        if (typeof existingImages === 'string') {
          try {
            existingImages = JSON.parse(existingImages);
          } catch (e) {
            existingImages = [existingImages as string]; // Handle single image as string
          }
        }
        updatedData.images = existingImages;
      }
      
      // Remove helper properties
      delete updatedData.keepExistingImages;
      delete updatedData.existingImages;
      
      // Update the product
      return this.productService.update(id, updatedData);
    } catch (error) {
      throw new BadRequestException(`Failed to update product: ${error.message}`);
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadImage(@UploadedFile() file: MulterFile) { // Use our custom interface
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    
    // Return the URL that can be accessed from the client
    return { 
      filename: file.filename,
      url: `${process.env.API_URL || 'http://localhost:3000'}/uploads/products/${file.filename}`
    };
  }
}