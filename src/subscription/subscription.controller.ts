import { Controller, Post, Get, Delete, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { CurrentUser, AuthenticatedUser } from 'src/config/decorators/current-user.decorators';
import { SubscriptionsService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-susbscription.dto';

@Controller('subscriptions')
@UseGuards(AuthenticationGuard)
export class SubscriptionsController {
    private readonly logger = new Logger(SubscriptionsController.name);

    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Post()
    async createSubscription(
        @CurrentUser() user: AuthenticatedUser,
        @Body() createSubscriptionDto: CreateSubscriptionDto
    ) {
        this.logger.log(`User ${user.id} is subscribing to ${createSubscriptionDto.roleSubscribed} role`);
        return this.subscriptionsService.createSubscription(user.id, createSubscriptionDto);
    }

    @Get()
    async getMySubscription(@CurrentUser() user: AuthenticatedUser) {
        return this.subscriptionsService.getUserSubscription(user.id);
    }

    @Delete()
    async cancelSubscription(@CurrentUser() user: AuthenticatedUser) {
        return this.subscriptionsService.cancelSubscription(user.id);
    }
}