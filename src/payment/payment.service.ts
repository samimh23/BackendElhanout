import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/Schemas/User.schema';
import { Role } from 'src/users/Schemas/Role.enum';
import { StripeService } from 'src/config/services/stripe.service';
import { SubscriptionsService } from 'src/subscription/subscription.service';
import { CreatePaymentIntentDto, VerifyPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  
  private subscriptionPrices = {
    [Role.Farmer]: 19.99,
    [Role.WHOLESALER]: 29.99,
  };

  constructor(
    private stripeService: StripeService,
    @InjectModel(User.name) private userModel: Model<User>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const amount = this.subscriptionPrices[dto.subscriptionType];
    if (!amount) {
      throw new BadRequestException(`Invalid subscription type: ${dto.subscriptionType}`);
    }

    const metadata = {
      userId,
      subscriptionType: dto.subscriptionType,
      email: user.email,
    };

    try {
      const paymentIntent = await this.stripeService.createPaymentIntent(amount, metadata);
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: 'usd',
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException('Payment processing failed');
    }
  }

  // This endpoint will be called by your Flutter app after payment confirmation
  async verifyPayment(dto: VerifyPaymentDto) {
    try {
      const paymentIntent = await this.stripeService.retrievePaymentIntent(dto.paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(`Payment not successful. Status: ${paymentIntent.status}`);
      }
      
      const { userId, subscriptionType } = paymentIntent.metadata;
      
      if (!userId || !subscriptionType) {
        throw new BadRequestException('Invalid payment metadata');
      }
      
      // Convert the subscriptionType string back to Role enum
      const roleSubscribed = subscriptionType as Role;
      
      // Check if the role is valid
      if (!Object.values(Role).includes(roleSubscribed)) {
        throw new BadRequestException(`Invalid subscription type in metadata: ${subscriptionType}`);
      }
      
      // Create the subscription now that payment is confirmed
      // Only passing the properties accepted by the DTO
      const subscription = await this.subscriptionsService.createSubscription(
        userId,
        { roleSubscribed: roleSubscribed }
      );
      
      // If you need to store the payment ID, you might need to update the subscription separately
      // or implement a method in your subscription service to handle this
      
      return {
        success: true,
        subscriptionId: subscription._id,
        subscriptionType: roleSubscribed,
        expiresAt: subscription.endDate
      };
    } catch (error) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      throw new BadRequestException(`Payment verification failed: ${error.message}`);
    }
  }
}