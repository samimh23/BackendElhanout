import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { User } from './Schemas/user.schema'; // Make sure the path is correct
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Rest of your service code remains the same
  async generateTwoFactorSecret(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate a secret
    const secret = authenticator.generateSecret();
    
    // Save the secret
    user.twoFactorSecret = secret;
    await user.save();

    // Generate OTP Auth URL for the QR code
    const appName = 'ElhanoutApp';
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
    
    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
    };
  }
  async verifyTwoFactorCode(
    userId: string, 
    code: string,
    options: { window?: number } = {}
): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
        return false;
    }

    // Verify the token, adding a window parameter to handle time sync issues
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: options.window || 2, // Allow +/- 1 minute by default
    });

    console.log(`2FA verification for user ${userId}: ${verified ? 'SUCCESS' : 'FAILED'}`);
    return verified;
}
  async enableTwoFactor(userId: string, twoFactorCode: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return false;
    }

    const isCodeValid = authenticator.verify({
      token: twoFactorCode,
      secret: user.twoFactorSecret,
    });

    if (isCodeValid) {
      user.isTwoFactorEnabled = true;
      user.isTwoFactorVerified = true;
      await user.save();
      return true;
    }

    return false;
  }

  async disableTwoFactor(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return false;
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.isTwoFactorVerified = false;
    await user.save();
    return true;
  }
}