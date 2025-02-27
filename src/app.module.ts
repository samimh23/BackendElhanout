import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import config from './config/config';
import { MailService } from './config/services/mail.service';

import { FarmModule } from './farm/farm.module';
import { NormalMarketModule } from './market/market.module';

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

    FarmModule,
    NormalMarketModule,
  ],
  controllers: [AppController],
  providers: [AppService,MailService],
})
export class AppModule {}