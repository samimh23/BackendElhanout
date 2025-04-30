import { Module } from '@nestjs/common';
import { HederaService } from './hedera.service';
import { HederaController } from './hedera.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/Schemas/User.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [HederaController],
  providers: [HederaService],
  exports: [HederaService],
})
export class HederaModule {}