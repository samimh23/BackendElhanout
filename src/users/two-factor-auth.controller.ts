    import { 
        Body, 
        Controller, 
        Get, 
        Post, 
        UseGuards, 
        Request 
    } from '@nestjs/common';
    import { UsersService } from './users.service';
    import { TwoFactorEnableDto } from './dtos/TwoFactorAuthDto.dto';
    import { AuthorizationGuard } from 'src/config/guards/authorazation.guard';
    import { AuthenticationGuard } from 'src/config/guards/authentication.guard';

    @Controller('2fa')
    export class TwoFactorAuthController {
        constructor(private readonly usersService: UsersService) {}

        @UseGuards(AuthenticationGuard) // Add this guard to protect the endpoint
        @Get('generate')
        async generateTwoFactorSecret(@Request() req) { 
            // Check if req.user exists and has the userId property
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated or userId not found');
            }
            return this.usersService.generateTwoFactorSecret(req.user.id); // Use userId instead of id
        }

        @UseGuards(AuthenticationGuard) // Add this guard
        @Post('enable')
        async enableTwoFactor(
            @Request() req,
            @Body() enableDto: TwoFactorEnableDto,
        ) {
            return this.usersService.enableTwoFactor(req.user.id, enableDto); // Use userId
        }

        @UseGuards(AuthenticationGuard) // Add this guard
        @Post('disable')
        async disableTwoFactor(@Request() req) {
            return this.usersService.disableTwoFactor(req.user.id); // Use userId
        }

        // This endpoint is for verifying 2FA during login, so no auth guard needed
        @Post('verify')
        async verifyTwoFactorAuth(
            @Body() body: { userId: string, twoFactorCode: string },
        ) {
            const { userId, twoFactorCode } = body;
            return this.usersService.verifyTwoFactorAuth(
                userId, 
                { twoFactorCode }
            );
        }
    }