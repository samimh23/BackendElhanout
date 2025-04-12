import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [StripeService],
  exports: [StripeService], // This is important! Export the service so other modules can use it
})
export class StripeModule {}