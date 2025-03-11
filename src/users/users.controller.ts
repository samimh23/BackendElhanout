    import { Controller, Post, Body, Logger, Param, Query, Get, UseGuards, NotFoundException, Req, UseInterceptors, UploadedFile, Delete, Put, BadRequestException, Request } from '@nestjs/common';
    import { UsersService } from './users.service';
    import { CreateUserDto } from './dtos/CreateUserDto.dto';
    import { User } from './Schemas/User.schema';
    import { Role } from './Schemas/Role.enum';
    import { LoginDto } from './dtos/login.dto';
    import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
    import { RolesGuard } from 'src/config/guards/role.guard';
    import { Roles } from 'src/config/decorators/roles.decorators';
    import { ChangePasswordDto } from './dtos/changepassword.dto';
    import { AuthenticatedUser, CurrentUser } from 'src/config/decorators/current-user.decorators';
    import { GoogleOAuthGuard } from 'src/config/guards/google-oauth.guard';
import { ProfileDto } from 'src/profile/dto/profile.dto';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Multer } from 'multer';

    @Controller('users')
    export class UsersController {
        private readonly logger = new Logger(UsersController.name);

        constructor(private readonly usersService: UsersService) {}

        @Post('signup')
        async signup(@Body() createUserDto: CreateUserDto): Promise<User> {
            this.logger.log(`Received signup request with email: ${createUserDto.email}`);
            return this.usersService.create(createUserDto);
        }
        @Get('by-role')
        async findallbyrole(@Query('role') role:Role) {
        return this.usersService.findbyrole(role);
        
        }
        //@UseGuards(RolesGuard)
        //@Roles( Role.WHOLESALER)
        @Post('login')
        async login (@Body() logindto: LoginDto):Promise<any>{
            return this.usersService.login(logindto);
        }
        @Post('refresh')
        async refreshTokens(@Body() refreshtoken:string): Promise<any> {
            return this.usersService.refreshToken(refreshtoken);
        }

        
        @Post('change-password')
        async changePassword(
            @CurrentUser() user: AuthenticatedUser,
            @Body() changePasswordDto: ChangePasswordDto
        ) {
            // Add debug logging
            this.logger.debug(`Received change password request for user:`, {
                userId: user.id,
                role: user.role,
                timestamp: new Date().toISOString()
            });

            if (!user?.id) {
                this.logger.error('No user ID in request');
                throw new NotFoundException('User information is incomplete');
            }

            try {
                return await this.usersService.changePassword(user.id, changePasswordDto);
            } catch (error) {
                this.logger.error(`Password change failed for user ${user.id}: ${error.message}`);
                throw error;
            }
        }

        @Post('forgot-password')
        async forgotPassword(@Body('email') email: string) {
            return this.usersService.ForgetPassword(email);
        }
    
        @Post('verify-reset-code')
        async verifyResetCode(@Body('resetToken') resetToken: string, @Body('code') code: string) {
            return this.usersService.verifyResetCode(resetToken, code);
        }
    
        @Post('reset-password')
        async resetPassword(@Body('verifiedToken') verifiedToken: string, @Body('newPassword') newPassword: string) {
            return this.usersService.resetPassword(verifiedToken, newPassword);
        }
       
        @Get('google-redirect')
        @UseGuards(GoogleOAuthGuard)
        googleAuthRedirect(@Req() req) {
        return this.usersService.googleLogin(req);
        }

        @Get('profile')
        @UseGuards(AuthenticationGuard)
        async getProfile(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getProfile(user.id);
        }

/**
 * Update the current user's profile
 */
@Put('profile')
@UseGuards(AuthenticationGuard)
async updateProfile(
  @CurrentUser() user: AuthenticatedUser,
  @Body() profileDto: ProfileDto
) {
  return this.usersService.updateProfile(user.id, profileDto);
}
@Post('upload-profile-picture')
@UseGuards(AuthenticationGuard)
@UseInterceptors(
  FileInterceptor('profilePicture', {
    storage: diskStorage({  
      destination: './uploads/profiles',
      filename: (req, file, callback) => {
        // Create a unique file name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `profile-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Accept only image files
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (validMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Invalid file type. Only JPG and PNG allowed.'), false);
      }
    },
    limits: {
      fileSize: 1024 * 1024 * 2, // 2MB max file size
    },
  }),
)
async uploadProfilePicture(@UploadedFile() file: Multer.File, @Request() req) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  console.log('Upload request received');
  console.log('req.user:', req.user);
  console.log('userId:', req.user.userId);
  // Get the user ID from the authenticated user
  const userId = req.user.id;
 

  // Create a URL for the uploaded file
  const fileUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/uploads/profiles/${file.filename}`;
  
  // Update the user's profile with the new picture URL
  await this.usersService.updateProfilePicture(userId, fileUrl);
  
  return {
    message: 'Profile picture uploaded successfully',
    profilePicture: fileUrl,
  };
}

/**
 * Upload a profile picture
 */

/**
 * Delete profile picture
 */
@Delete('profile/picture')
@UseGuards(AuthenticationGuard)
async removeProfilePicture(@CurrentUser() user: AuthenticatedUser) {
  return this.usersService.removeProfilePicture(user.id);
}
    }