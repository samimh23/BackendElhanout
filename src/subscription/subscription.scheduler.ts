import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsService } from './subscription.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionsScheduler {
    private readonly logger = new Logger(SubscriptionsScheduler.name);

    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleExpiredSubscriptions() {
        this.logger.log('Checking for expired subscriptions...');
        await this.subscriptionsService.checkSubscriptionStatus();
    }
}