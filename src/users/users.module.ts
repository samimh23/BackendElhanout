import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ValidationPipe } from '@nestjs/common';
import { User, UserSchema } from './Schemas/user.schema';
import { RefreshToken, RefreshTokenSchema } from './Schemas/refreshtoken.schema';
import { ResetToken, ResetTokenSchema } from './Schemas/reset-token.schema';
import { MailModule } from 'src/config/services/mail.module';
import { APP_PIPE } from '@nestjs/core';
import { RolesGuard } from 'src/config/guards/role.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/mutler/mutler.config';
import { TwoFactorAuthController } from './two-factor-auth.controller';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      dest: './uploads/profiles',
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: ResetToken.name, schema: ResetTokenSchema },
    ]),
    MailModule,
    MulterModule.register(multerConfig),
  ],
  providers: [
    GoogleStrategy,
    UsersService,
    TwoFactorAuthService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  controllers: [UsersController,TwoFactorAuthController],
  exports: [UsersService,TwoFactorAuthService],
})
export class UsersModule {}