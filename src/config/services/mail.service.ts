import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Error connecting to Gmail:', error);
      } else {
        console.log('Connected to Gmail successfully!');
      }
    });
  }

  private getEmailTemplate(templateName: string, data: any): string {
    const templates = {
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">Welcome to Our Platform</h1>
            <p style="color: #34495e; line-height: 1.6;">Dear ${data.name},</p>
            <p style="color: #34495e; line-height: 1.6;">
              ${data.isAdmin 
                ? 'Your admin account has been successfully created. Welcome to our platform!' 
                : 'Welcome to our platform! Your account has been successfully created.'}
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/login" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Login to Your Account</a>
            </div>
            <p style="color: #7f8c8d; margin-top: 30px; text-align: center; font-size: 14px;">
              Best regards,<br>The Team
            </p>
          </div>
        </div>
      `,

      accountStatus: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
              Account ${data.isActive ? 'Activated' : 'Deactivated'}
            </h1>
            <p style="color: #34495e; line-height: 1.6;">Dear User,</p>
            <p style="color: #34495e; line-height: 1.6;">
              ${data.isActive 
                ? 'Your account has been activated. You can now log in to access our platform.' 
                : 'Your account has been deactivated. If you believe this is an error, please contact our support team.'}
            </p>
            ${data.isActive ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/login" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Login Now</a>
              </div>
            ` : ''}
            <p style="color: #7f8c8d; margin-top: 30px; text-align: center; font-size: 14px;">
              Best regards,<br>The Team
            </p>
          </div>
        </div>
      `,

      resetCode: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">Password Reset Code</h1>
            <p style="color: #34495e; line-height: 1.6;">Dear User,</p>
            <p style="color: #34495e; line-height: 1.6;">You have requested to reset your password. Here is your verification code:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #2c3e50;">${data.resetCode}</span>
            </div>
            <p style="color: #34495e; line-height: 1.6;">This code will expire in 15 minutes.</p>
            <p style="color: #e74c3c; font-size: 14px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            <p style="color: #7f8c8d; margin-top: 30px; text-align: center; font-size: 14px;">
              Best regards,<br>The Team
            </p>
          </div>
        </div>
      `,

      passwordResetSuccess: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">Password Reset Successful</h1>
            <p style="color: #34495e; line-height: 1.6;">Dear User,</p>
            <p style="color: #34495e; line-height: 1.6;">Your password has been successfully reset.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/login" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Login with New Password</a>
            </div>
            <p style="color: #e74c3c; font-size: 14px; margin-top: 20px;">If you didn't make this change, please contact support immediately.</p>
            <p style="color: #7f8c8d; margin-top: 30px; text-align: center; font-size: 14px;">
              Best regards,<br>The Team
            </p>
          </div>
        </div>
      `
    };

    return templates[templateName] || '';
  }

  async sendEmail(to: string, subject: string, content: string, isHtml: boolean = true): Promise<void> {
    const mailOptions = {
      from: `Auth-backend service <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      [isHtml ? 'html' : 'text']: content,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, name: string, isAdmin: boolean): Promise<void> {
    const subject = isAdmin 
      ? 'Welcome to Our Platform - Admin Account Created'
      : 'Welcome to Our Platform';

    const htmlContent = this.getEmailTemplate('welcome', { name, isAdmin });
    await this.sendEmail(email, subject, htmlContent);
  }

  async sendAccountStatusChangeEmail(email: string, isActive: boolean): Promise<void> {
    const subject = isActive ? 'Account Activated' : 'Account Deactivated';
    const htmlContent = this.getEmailTemplate('accountStatus', { isActive });
    await this.sendEmail(email, subject, htmlContent);
  }

  async sendResetEmail(email: string, resetCode: string): Promise<void> {
    const subject = 'Password Reset Code';
    const htmlContent = this.getEmailTemplate('resetCode', { resetCode });
    await this.sendEmail(email, subject, htmlContent);
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    const subject = 'Password Reset Successful';
    const htmlContent = this.getEmailTemplate('passwordResetSuccess', {});
    await this.sendEmail(email, subject, htmlContent);
  }
}