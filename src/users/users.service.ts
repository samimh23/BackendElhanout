import { Injectable, BadRequestException, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
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

type LoginResult = { accessToken: string , refreshToken: string };

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
        private jwtService: JwtService
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, role, password, ...rest } = createUserDto;

        const userExists = await this.userModel.findOne({ email });
        if (userExists) {
            throw new BadRequestException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let user: User;
        switch (role) {
            case 'Client':
                user = new this.userModel({ ...rest, email, role, password: hashedPassword, __t: 'Client' });
                break;
            case 'Merchant':
                user = new this.userModel({ ...rest, email, role, password: hashedPassword, __t: 'Merchant' });
                break;
            case 'Wholesaler':
                user = new this.userModel({ ...rest, email, role, password: hashedPassword, __t: 'Wholesaler' });
                break;
            case 'Farmer':
                user = new this.userModel({ ...rest, email, role, password: hashedPassword, __t: 'Farmer' });
                break;
            case 'FactoryOwner':
                user = new this.userModel({ ...rest, email, role, password: hashedPassword, __t: 'FactoryOwner' });
                break;
            default:
                throw new BadRequestException('Invalid role');
        }

        this.logger.log(`Creating user with email: ${email} and role: ${role}`);
        return user.save();
    }

    async findbyrole(role: Role): Promise<User[]> {
        return this.userModel.find({ role }).exec();
    }

    async login(logindto: LoginDto): Promise<LoginResult> {
        const { email, password } = logindto;
        const userExist = await this.userModel.findOne({ email });
        if (!userExist) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(password, userExist.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateUserToken(userExist._id.toString());

        return { accessToken: tokens.accessToken,   refreshToken: tokens.refreshToken };
    }

    async refreshToken(refreshToken: string) {
        const token = await this.refreshTokenModel.findOne({ token: refreshToken, expiryDate: { $gt: new Date() } });
        if (!token) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.generateUserToken(token.userId.toString());
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
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
}