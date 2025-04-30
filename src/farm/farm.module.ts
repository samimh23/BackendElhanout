import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmController } from './farm.controller';
import { FarmService } from './farm.service';
import { FarmMarket, FarmMarketSchema } from './schema/farm.schema';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from 'src/users/Schemas/User.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: FarmMarket.name, schema: FarmMarketSchema },
      {name: User.name, schema: UserSchema}
    ]),
    ConfigModule,
  ],
  controllers: [FarmController],
  providers: [FarmService],
})
export class FarmModule {}
