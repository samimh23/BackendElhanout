import { Module } from '@nestjs/common';
import { FarmCropService } from './farm-crop.service';
import { FarmCropController } from './farm-crop.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmCrop, FarmCropSchema } from './Schema/farm-crop.schema';
import { farmCropMulterConfig } from 'src/config/mutler/multer_farmCrop.config';
import { MulterModule } from '@nestjs/platform-express';


@Module({
  imports: [
     MulterModule.register(farmCropMulterConfig),
    MongooseModule.forFeature([
      { name: FarmCrop.name, schema: FarmCropSchema }, // Register the schema here
    ]),

  ],
  controllers: [FarmCropController],
  providers: [FarmCropService],
})
export class FarmCropModule {}
