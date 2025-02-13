import { Controller, Post, Body, Logger, Param, Query, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/CreateUserDto.dto';
import { User } from './Schemas/User.schema';
import { Role } from './Schemas/Role.enum';
import { LoginDto } from './dtos/login.dto';


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
    async findallbyrole(@Query('role') role:Role): Promise<User[]> {
     return this.usersService.findbyrole(role);
       
    }

    @Post('login')
    async login (@Body() logindto: LoginDto):Promise<any>{
        return this.usersService.login(logindto);
    }
    @Post('refresh')
    async refreshTokens(@Body() refreshtoken:string): Promise<any> {
        return this.usersService.refreshToken(refreshtoken);
    }
}