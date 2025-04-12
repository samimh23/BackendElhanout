import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/Schemas/User.schema';

import { SubscriptionStatus } from './Enum/SubscriptionStatus.enum';
import { Subscription } from './Schema/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-susbscription.dto';

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
        @InjectModel(User.name) private userModel: Model<User>
    ) {}

    async createSubscription(userId: string, createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
        // Check if user exists
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user already has an active subscription
        const existingSubscription = await this.subscriptionModel.findOne({
            userId,
            status: SubscriptionStatus.ACTIVE
        });

        if (existingSubscription) {
            throw new BadRequestException('User already has an active subscription');
        }

        // Create subscription with 30 days validity
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days subscription

        const newSubscription = new this.subscriptionModel({
            userId,
            roleSubscribed: createSubscriptionDto.roleSubscribed,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate
        });

        // Update user role
        await this.userModel.findByIdAndUpdate(userId, {
            role: createSubscriptionDto.roleSubscribed
        });

        this.logger.log(`Created subscription for user ${userId} with role ${createSubscriptionDto.roleSubscribed}`);
        return await newSubscription.save();
    }

    async getUserSubscription(userId: string): Promise<Subscription> {
        const subscription = await this.subscriptionModel.findOne({ 
            userId, 
            status: SubscriptionStatus.ACTIVE 
        }).exec();
        
        if (!subscription) {
            throw new NotFoundException('No active subscription found for this user');
        }
        
        return subscription;
    }

    async cancelSubscription(userId: string): Promise<Subscription> {
        const subscription = await this.subscriptionModel.findOne({
            userId,
            status: SubscriptionStatus.ACTIVE
        });

        if (!subscription) {
            throw new NotFoundException('No active subscription found');
        }

        subscription.status = SubscriptionStatus.CANCELLED;
        subscription.cancelledAt = new Date();

        // Reset user role to CLIENT
        await this.userModel.findByIdAndUpdate(userId, {
            role: 'Client'
        });

        this.logger.log(`Cancelled subscription for user ${userId}`);
        return await subscription.save();
    }

    async checkSubscriptionStatus(): Promise<void> {
        // Find all expired subscriptions
        const expiredSubscriptions = await this.subscriptionModel.find({
            status: SubscriptionStatus.ACTIVE,
            endDate: { $lt: new Date() }
        });

        for (const subscription of expiredSubscriptions) {
            subscription.status = SubscriptionStatus.EXPIRED;
            await subscription.save();

            // Reset user role to CLIENT
            await this.userModel.findByIdAndUpdate(subscription.userId, {
                role: 'Client'
            });

            this.logger.log(`Expired subscription for user ${subscription.userId}`);
        }
    }
}