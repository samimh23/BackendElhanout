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
    [Role.MERCHANT]: 29.99,
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

  async createCheckoutSession(userId: string, dto: CreatePaymentIntentDto) {
    try {
      const amount = this.subscriptionPrices[dto.subscriptionType];
      if (!amount) {
        throw new BadRequestException(`Invalid subscription type: ${dto.subscriptionType}`);
      }
      
      // Find the user to include their email
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      const session = await this.stripeService.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${dto.subscriptionType} Subscription`,
                description: `30-day Subscription for ${dto.subscriptionType} access`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://192.168.251.19:3000'}/payments/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/cancel`,
        customer_email: user.email, // Pre-fill customer email
        client_reference_id: userId,
        metadata: {
          userId: userId,
          subscriptionType: dto.subscriptionType,
        },
      });
  
      return {
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Error creating checkout session: ${error.message}`);
      throw new BadRequestException(`Checkout session creation failed: ${error.message}`);
    }
  }

  // Add this method to check payment status
  async checkSessionStatus(sessionId: string) {
    try {
      const session = await this.stripeService.stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return {
          success: false,
          status: session.payment_status,
          message: 'Payment not completed yet'
        };
      }
      
      // Extract user ID and subscription type from metadata
      const userId = session.client_reference_id;
      const subscriptionType = session.metadata.subscriptionType;
      
      if (!userId || !subscriptionType) {
        throw new BadRequestException('Invalid session metadata');
      }
      
      // Check if subscription already exists
      try {
        await this.subscriptionsService.getUserSubscription(userId);
        return {
          success: true,
          status: 'subscription_exists',
          message: 'Subscription already active'
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          // Create subscription since it doesn't exist
          const subscription = await this.processSuccessfulPayment(
            userId,
            subscriptionType,
            session.payment_intent as string
          );
          
          return {
            success: true,
            status: 'subscription_created',
            subscription
          };
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to check session status: ${error.message}`);
      throw new BadRequestException(`Session status check failed: ${error.message}`);
    }
  }

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
      
      return this.processSuccessfulPayment(userId, subscriptionType, dto.paymentIntentId);
    } catch (error) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      throw new BadRequestException(`Payment verification failed: ${error.message}`);
    }
  }

  async processSuccessfulPayment(userId: string, subscriptionType: string, paymentId: string) {
    this.logger.log(`Processing successful payment for user ${userId}, subscription: ${subscriptionType}`);
    
    // Convert the subscriptionType string back to Role enum
    const roleSubscribed = subscriptionType as Role;
    
    // Check if the role is valid
    if (!Object.values(Role).includes(roleSubscribed)) {
      throw new BadRequestException(`Invalid subscription type: ${subscriptionType}`);
    }
    
    try {
      // Create the subscription now that payment is confirmed
      const subscription = await this.subscriptionsService.createSubscription(
        userId,
        { 
          roleSubscribed,
          paymentIntentId: paymentId 
        }
      );
      
      this.logger.log(`Subscription created successfully: ${subscription._id}`);
      
      return {
        success: true,
        subscriptionId: subscription._id,
        subscriptionType: roleSubscribed,
        expiresAt: subscription.endDate
      };
    } catch (error) {
      this.logger.error(`Failed to create subscription after payment: ${error.message}`);
      throw new BadRequestException(`Subscription creation failed: ${error.message}`);
    }
  }
}