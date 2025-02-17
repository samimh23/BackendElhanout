import { Controller, Post, Body, Logger, Param, Query, Get, UseGuards, NotFoundException } from '@nestjs/common';
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
   // @UseGuards(RolesGuard)
    //@Roles( Role.WHOLESALER)
    @Post('login')
    async login (@Body() logindto: LoginDto):Promise<any>{
        return this.usersService.login(logindto);
    }
    @Post('refresh')
    async refreshTokens(@Body() refreshtoken:string): Promise<any> {
        return this.usersService.refreshToken(refreshtoken);
    }

    @UseGuards(AuthenticationGuard)
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
}