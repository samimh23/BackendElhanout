    import { Controller, Post, Body, Logger, Param, Query, Get, UseGuards, NotFoundException, Req, UseInterceptors, UploadedFile, Delete, Put } from '@nestjs/common';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
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
        @Get()
        @UseGuards(GoogleOAuthGuard)
        async googleAuth(@Req() req) {}
    
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

/**
 * Upload a profile picture
 */
@Post('profile/picture')
@UseGuards(AuthenticationGuard)
@UseInterceptors(FileInterceptor('file'))
async uploadProfilePicture(
  @CurrentUser() user: AuthenticatedUser,
  @UploadedFile() file: Multer.File
) {
  return this.usersService.uploadProfilePicture(user.id, file);
}

/**
 * Delete profile picture
 */
@Delete('profile/picture')
@UseGuards(AuthenticationGuard)
async removeProfilePicture(@CurrentUser() user: AuthenticatedUser) {
  return this.usersService.removeProfilePicture(user.id);
}
    }