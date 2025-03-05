import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import config from './config/config';
import { MailService } from './config/services/mail.service';
import { SubscriptionsModule } from './subscription/subscription.module';
import { PaymentsController } from './payment/payment.controller';
import { PaymentsService } from './payment/payment.service';
import Stripe from 'stripe';
import { StripeModule } from './config/services/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.connectionString'),
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true, 
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return {
          secret: secret,
          signOptions: { 
            expiresIn: configService.get<string>('jwt.expiresIn') 
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    StripeModule,
    SubscriptionsModule,
    
  ],
  controllers: [AppController, PaymentsController],
  providers: [AppService,MailService, PaymentsService],
})
export class AppModule {}