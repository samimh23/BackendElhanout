import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createPaymentIntent(amount: number, metadata: any): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: this.configService.get('STRIPE_CURRENCY', 'usd'),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Created payment intent ${paymentIntent.id} for amount ${amount}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw error;
    }
  }

  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(id);
  }
}