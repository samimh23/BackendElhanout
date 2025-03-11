import { Injectable, BadRequestException, Logger, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/CreateUserDto.dto';
import { User } from './Schemas/User.schema';
import { Role } from './Schemas/Role.enum';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { RefreshToken } from './Schemas/refreshtoken.schema';
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ResetToken } from './Schemas/reset-token.schema';
import { MailService } from 'src/config/services/mail.service';
import { ChangePasswordDto } from './dtos/changepassword.dto';
import { ProfileDto } from 'src/profile/dto/profile.dto';
import { Express } from 'express';
import { Multer } from 'multer';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuthDto, TwoFactorEnableDto } from './dtos/TwoFactorAuthDto.dto';
type LoginResult = { 
    accessToken: string, 
    refreshToken: string,
    user?: {
      id: string,
      email: string,
      role: string,
      name?: string
    }
  };
@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
        @InjectModel(ResetToken.name) private resetTokenModel: Model<ResetToken>,
      
        private readonly twoFactorAuthService: TwoFactorAuthService, private readonly mailService: MailService,
        private jwtService: JwtService
    ) {}

    async generateTwoFactorSecret(userId: string) {
        return this.twoFactorAuthService.generateTwoFactorSecret(userId);
    }
    
    async enableTwoFactor(userId: string, enableDto: TwoFactorEnableDto) {
        const isEnabled = await this.twoFactorAuthService.enableTwoFactor(
            userId, 
            enableDto.twoFactorCode
        );
        
        if (!isEnabled) {
            throw new UnauthorizedException('Invalid two-factor code');
        }
        
        return { message: 'Two-factor authentication enabled successfully' };
    }
    
    async verifyTwoFactorAuth(userId: string, twoFactorAuthDto: TwoFactorAuthDto): Promise<LoginResult> {
        try {
          console.log(`Verifying 2FA for user ID: ${userId}`);
          console.log(`Received code: ${twoFactorAuthDto.twoFactorCode}`);
          
          // Verify the 2FA code with a wider time window to handle time sync issues
          const isCodeValid = await this.twoFactorAuthService.verifyTwoFactorCode(
            userId,
            twoFactorAuthDto.twoFactorCode,
            { window: 2 }  // Allow codes from +/- 1 minute window
          );
          
          if (!isCodeValid) {
            console.log(`Invalid 2FA code for user: ${userId}`);
            throw new UnauthorizedException('Invalid two-factor code');
          }
          
          console.log(`2FA verification successful for user: ${userId}`);
          
          // Find the user to include user data in response
          const user = await this.userModel.findById(userId);
          if (!user) {
            throw new NotFoundException('User not found');
          }
          
          // Generate tokens after successful 2FA verification
          const tokens = await this.generateUserToken(userId);
          
          // Return tokens AND user info
          return { 
            accessToken: tokens.accessToken, 
            refreshToken: tokens.refreshToken,
            user: {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
              name: user.name,
            }
          };
        } catch (error) {
          console.error('Error in 2FA verification:', error.message);
          throw error;
        }
      }
    async disableTwoFactor(userId: string) {
        const isDisabled = await this.twoFactorAuthService.disableTwoFactor(userId);
        
        if (!isDisabled) {
            throw new NotFoundException('User not found');
        }
        
        return { message: 'Two-factor authentication disabled successfully' };
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, ...rest } = createUserDto;

        const userExists = await this.userModel.findOne({ email });
        if (userExists) {
            throw new BadRequestException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new this.userModel({ ...rest, email, role: 'Client', password: hashedPassword, __t: 'Client' });

        this.logger.log(`Creating user with email: ${email} and role: Client`);
        return user.save();
    }

    async findbyrole(role: Role): Promise<User[]> {
        return this.userModel.find({ role }).exec();
        ///return status
    }

    async login(logindto: LoginDto): Promise<LoginResult | { userId: string, requireTwoFactor: boolean }> {
        const { email, password } = logindto;
        const userExist = await this.userModel.findOne({ email });
        
        if (!userExist) {
            throw new UnauthorizedException('Invalid email or password');
        }
        
        // Check for password
        if (!userExist.password) {
            this.logger.error(`User ${email} attempted to login with password but has no password stored`);
            throw new UnauthorizedException('This account cannot be accessed with a password. Try signing in with Google.');
        }
        
        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, userExist.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }
    
        // Check if 2FA is enabled
        if (userExist.isTwoFactorEnabled) {
            return {
                userId: userExist._id.toString(),
                requireTwoFactor: true
            };
        }
        
        // If 2FA is not enabled, generate tokens as usual
        const tokens = await this.generateUserToken(userExist._id.toString());
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    async refreshToken(refreshToken: string) {
        // Find token by hashed value - this needs to be fixed
        // You need to find all tokens and compare the hash
        const tokens = await this.refreshTokenModel.find({ expiryDate: { $gt: new Date() } });
        let foundToken = null;
        
        for (const token of tokens) {
            // Compare the provided refresh token with the stored hash
            const isMatch = await bcrypt.compare(refreshToken, token.token);
            if (isMatch) {
                foundToken = token;
                break;
            }
        }
        
        if (!foundToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        
        const newTokens = await this.generateUserToken(foundToken.userId.toString());
        return { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken };
    }

    async generateUserToken(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const accessToken = this.jwtService.sign({ userId, role: user.role }, { expiresIn: '2h' });
        const refreshToken = uuidv4();

        await this.storeRefreshToken(userId, refreshToken);
        return { accessToken, refreshToken };
    }

    async storeRefreshToken(userId: string, refreshToken: string) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        await this.refreshTokenModel.updateOne(
            { userId },
            { $set: { token: hashedRefreshToken, expiryDate } },
            { upsert: true }
        );
    }

    async ForgetPassword(email: string): Promise<{ resetToken: string }> {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        try {
            const resetCode = randomInt(100000, 999999).toString();
            const resetToken = nanoid();
            await this.resetTokenModel.deleteMany({ userId: user._id });
            const reset = new this.resetTokenModel({
                userId: user._id,
                token: resetCode,
                resetToken,
                expiryDate: new Date(Date.now() + 1000 * 60 * 10),
            });
            await reset.save(); // Missing save() call
            
            // Uncomment if you need to send reset emails
             await this.mailService.sendResetEmail(user.email, resetCode);

            // Return the reset token to be used in subsequent requests
            return { resetToken };
        }
        catch (e) {
            this.logger.error(`Error generating reset token: ${e.message}`);
            throw new BadRequestException('Error while generating reset token');
        }
    }
    
    async verifyResetCode(resetToken: string, code: string): Promise<{ verifiedToken: string }> {
        const resetRecord = await this.resetTokenModel.findOne({
            resetToken,
            token: code,
            expiryDate: { $gt: new Date() }
        });

        if (!resetRecord) {
            throw new UnauthorizedException('Invalid or expired reset code');
        }

        // Generate a verified token
        const verifiedToken = nanoid();
        
        // Update reset record with verified token
        resetRecord.verifiedToken = verifiedToken;
        resetRecord.isVerified = true;
        await resetRecord.save();

        return { verifiedToken };
    }
    
    async resetPassword(verifiedToken: string, newPassword: string): Promise<void> {
        const resetRecord = await this.resetTokenModel.findOne({
            verifiedToken,
            isVerified: true,
            expiryDate: { $gt: new Date() }
        });
    
        if (!resetRecord) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }
    
        try {
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
    
            // Update user's password
            await this.userModel.findByIdAndUpdate(resetRecord.userId, {
                password: hashedPassword,
                // Only include isFirstLogin if it's defined in your User schema
                // isFirstLogin: false
            });
    
            // Delete the used reset token
            await this.resetTokenModel.deleteOne({ _id: resetRecord._id });
    
            // Invalidate all refresh tokens for this user
            await this.refreshTokenModel.deleteMany({ userId: resetRecord.userId });
    
            // Send confirmation email - uncomment if needed
            const user = await this.userModel.findById(resetRecord.userId);
            if (user) {
                // await this.mailService.sendPasswordResetConfirmation(user.email);
            }
        } catch (error) {
            this.logger.error(`Failed to reset password: ${error.message}`);
            throw new InternalServerErrorException('Failed to reset password');
        }
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        this.logger.debug(`Attempting to change password for user: ${userId}`);

        if (!userId) {
            this.logger.error('No user ID provided to changePassword');
            throw new NotFoundException('User ID is required');
        }

        // Find the user - use lean() for better performance
        const user = await this.userModel.findById(userId).lean();

        if (!user) {
            this.logger.error(`User with ID ${userId} not found in database`);
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            changePasswordDto.currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            this.logger.error(`Invalid current password for user ${userId}`);
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        try {
            // Update the password
            await this.userModel.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );

            this.logger.log(`Successfully changed password for user ${userId}`);
            return { message: 'Password changed successfully' };
        } catch (error) {
            this.logger.error(`Failed to update password for user ${userId}: ${error.message}`);
            throw new InternalServerErrorException('Failed to update password');
        }
    }

    async googleLogin(req) {
        if (!req.user) {
            this.logger.error('No user data received from Google');
            throw new UnauthorizedException('No user from Google');
        }
    
        const { email, firstName, lastName, picture } = req.user;
    
        try {
            // Check if user exists
            let user = await this.userModel.findOne({ email });
    
            if (!user) {
                this.logger.log(`Creating new user from Google login: ${email}`);
                // Create new user if doesn't exist
                user = await this.userModel.create({
                    email,
                    firstName,
                    lastName,
                    profilepicture: picture,
                    role: 'Client', // Using string value that matches your enum
                    provider: 'google',
                    isEmailVerified: true,
                    // Add a random password for Google users to satisfy schema requirement
                    password: crypto.randomBytes(32).toString('hex'),
                    // Or if you have bcrypt available:
                    // password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                });
            } else if (user.provider !== 'google') {
                this.logger.warn(`User ${email} attempting to login via Google but originally registered with ${user.provider}`);
                throw new BadRequestException('Email already registered with different method');
            }
    
            // Generate tokens using your existing token generation method
            const tokens = await this.generateUserToken(user._id.toString());
    
            return {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.name, // Changed from user.name to match the schema
                    lastName: user.name, // Added lastName
                    picture: user.profilepicture,
                    role: user.role
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };
        } catch (error) {
            this.logger.error(`Google login failed: ${error.message}`);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new UnauthorizedException('Failed to process Google login');
        }
    }

    async getProfile(userId: string) {
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
        
        // Map the user data to match what your frontend expects
        return {
          id: user._id,
          name: user.name ,
          email: user.email,
          phonenumbers: user.phonenumbers || [],
          profilepicture: user.profilepicture || '',
          role: user.role,
          // Include any additional fields needed by frontend
        };
      }
      
      /**
       * Updates the profile data for a user
       */
      async updateProfile(userId: string, profileDto: ProfileDto) {
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
        
        // Update only the provided fields
        if (profileDto.name !== undefined) user.name = profileDto.name;
        if (profileDto.email !== undefined && profileDto.email !== user.email) {
          // Check if new email is already taken
          const existingUser = await this.userModel.findOne({ email: profileDto.email });
          if (existingUser && existingUser._id.toString() !== userId) {
            throw new BadRequestException('Email is already in use');
          }
          user.email = profileDto.email;
        }
        if (profileDto.phonenumbers !== undefined) user.phonenumbers = profileDto.phonenumbers;
        if (profileDto.cin !== undefined) user.cin = profileDto.cin;
        
        await user.save();
        
        return this.getProfile(userId);
      }
      
      /**
       * Uploads and sets a profile picture for a user
       */
      async uploadProfilePicture(userId: string, file: Multer.File) {
        try {
          const user = await this.userModel.findById(userId);
          
          if (!user) {
            throw new NotFoundException('User not found');
          }
          
          if (!file) {
            throw new BadRequestException('No file provided');
          }
          
          // Log file details
          console.log('Processing file:', {
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
          });
          
          // Create the proper URL path with leading slash
          const fileUrl = `/uploads/profiles/${file.filename}`;
          console.log('File URL to be saved:', fileUrl);
          
          // Update user record
          user.profilepicture = fileUrl;
          await user.save();
          
          console.log('Updated user profile with picture URL:', fileUrl);
          
          return { 
            success: true,
            message: 'Profile picture uploaded successfully',
            profilepicture: fileUrl,
            fullUrl: `http://localhost:3000${fileUrl}`
          };
        } catch (error) {
          this.logger.error(`Failed to upload profile picture: ${error.message}`);
          console.error('Error details:', error);
          throw new InternalServerErrorException('Failed to upload profile picture');
        }
      }
      
      /**
       * Removes the profile picture for a user
       */
      async removeProfilePicture(userId: string) {
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
        
        // If user has a profile picture, remove the file and update the user
        if (user.profilepicture) {
          try {
            const filePath = path.join('.', user.profilepicture);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            this.logger.error(`Failed to delete profile picture file: ${error.message}`);
            // Continue even if file deletion fails
          }
          
          user.profilepicture = null;
          await user.save();
        }
        
        return { message: 'Profile picture removed successfully' };
      }

      async updateProfilePicture(userId: string, profilePictureUrl: string) {
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
        
        user.profilepicture = profilePictureUrl;
        await user.save();
        
        return user;
      }
}