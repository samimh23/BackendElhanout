import { 
    Controller, 
    Post, 
    Body, 
    UseGuards, 
  } from '@nestjs/common';
  import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
  import { CurrentUser, AuthenticatedUser } from 'src/config/decorators/current-user.decorators';
import { PaymentsService } from './payment.service';
import { CreatePaymentIntentDto, VerifyPaymentDto } from './dto/payment.dto';
  
  @Controller('payments')
  export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}
  
    @UseGuards(AuthenticationGuard)
    @Post('create-intent')
    async createPaymentIntent(
      @CurrentUser() user: AuthenticatedUser,
      @Body() createPaymentIntentDto: CreatePaymentIntentDto
    ) {
      return this.paymentsService.createPaymentIntent(user.id, createPaymentIntentDto);
    }
  
    @UseGuards(AuthenticationGuard)
    @Post('verify')
    async verifyPayment(
      @Body() verifyPaymentDto: VerifyPaymentDto
    ) {
      return this.paymentsService.verifyPayment(verifyPaymentDto);
    }
  }