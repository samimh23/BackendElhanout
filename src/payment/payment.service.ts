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

  async createCheckoutSession(userId: string, dto: CreatePaymentIntentDto) {
    try {
      // Fix 1: Use this.subscriptionPrices instead of SUBSCRIPTION_PRICES
      const amount = this.subscriptionPrices[dto.subscriptionType];
      if (!amount) {
        throw new BadRequestException(`Invalid subscription type: ${dto.subscriptionType}`);
      }
      
      // Find the user to include their email
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      // Fix 2: Access Stripe's checkout directly from the stripe object
      const session = await this.stripeService.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${dto.subscriptionType} Subscription`,
                description: `Subscription for ${dto.subscriptionType} access`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
        customer_email: user.email, // Pre-fill customer email
        client_reference_id: userId,
        metadata: {
          userId: userId,
          subscriptionType: dto.subscriptionType,
        },
      });
  
      // Get the PaymentIntent ID from the session
      const paymentIntentId = session.payment_intent as string;
  
      return {
        sessionId: session.id,
        paymentIntentId,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Error creating checkout session: ${error.message}`);
      throw new BadRequestException(`Checkout session creation failed: ${error.message}`);
    }
  }

  // Rest of the service methods remain unchanged
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

  /*async verifyPayment(dto: VerifyPaymentDto) {
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
      const subscription = await this.subscriptionsService.createSubscription(
        userId,
        { roleSubscribed: roleSubscribed }
      );
      
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
  }*/
}