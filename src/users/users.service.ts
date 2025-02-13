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

import { ResetToken } from './Schemas/reset-token.schema';
type LoginResult = { accessToken: string , refreshToken: string };

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
        @InjectModel(ResetToken.name) private resetTokenModel: Model<ResetToken>,

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

    async ForgetPassword(email:string):Promise<{ resetToken: string }>{
        const user = await this.userModel.findOne({email})
        if(!user){
            throw new NotFoundException('User not found')
        }
        try{
            const resetCode =randomInt(100000,999999).toString()
            const resetToken =nanoid()
            await this.resetTokenModel.deleteMany({ userId: user._id });
            const reset = new this.resetTokenModel({
                userId: user._id,
                token: resetCode,
                resetToken,
                expiryDate: new Date(Date.now() + 1000 * 60 * 10),
            });
            //await this.mailService.sendResetEmail(user.email, resetCode);

            // Return the reset token to be used in subsequent requests
            return { resetToken };

        }
        catch(e){
            throw new BadRequestException('Error while generating reset token')
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
                isFirstLogin: false
            });
    
            // Delete the used reset token
            await this.resetTokenModel.deleteOne({ _id: resetRecord._id });
    
            // Invalidate all refresh tokens for this user
            await this.refreshTokenModel.deleteMany({ userId: resetRecord.userId });
    
            // Send confirmation email
            const user = await this.userModel.findById(resetRecord.userId);
            if (user) {
               // await this.mailService.sendPasswordResetConfirmation(user.email);
            }
        } catch (error) {
            throw new InternalServerErrorException('Failed to reset password');
        }
    }
}