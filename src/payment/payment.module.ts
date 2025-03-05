import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payment.controller';
import { PaymentsService } from './payment.service';
import { User, UserSchema } from 'src/users/Schemas/User.schema';
import { StripeService } from 'src/config/services/stripe.service';
import { SubscriptionsModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    SubscriptionsModule, // Import the module containing SubscriptionsService
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService], // Include StripeService here
  exports: [PaymentsService], // Export PaymentsService if needed elsewhere
})
export class PaymentModule {}