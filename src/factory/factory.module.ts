import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { FactoryMarket, FactoryMarketSchema } from './schema/factory.schema';
import { FactoryController } from './factory.controller';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: FactoryMarket.name, schema: FactoryMarketSchema }]),
  ],
  controllers: [FactoryController],  
  providers: [FactoryService],
  exports: [FactoryService],
})
export class FactoryModule {}
