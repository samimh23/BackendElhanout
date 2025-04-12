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
import { PaymentModule } from './payment/payment.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { OrderModule } from './order/order.module';
import { ProductModule } from './product/product.module';
import { NormalMarketModule } from './market/market.module';
import { FarmSaleModule } from './farm-sale/farm-sale.module';
import { FarmCropModule } from './farm-crop/farm-crop.module';
import { FarmModule } from './farm/farm.module';
import { TwoFactorAuthModule } from './users/two-factor-auth.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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
    NormalMarketModule,
    ProductModule,
    OrderModule,
    PaymentModule, 
    FarmModule,
    FarmCropModule,
    FarmSaleModule,
    TwoFactorAuthModule,
    ReviewsModule,
    ReservationModule
  ],
  controllers: [AppController],
  providers: [AppService,MailService],
})
export class AppModule {}