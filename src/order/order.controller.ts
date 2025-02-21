import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
    async createOrder(@Body() createOrderDto: CreateOrderDto) {
        return this.orderService.createAnOrder(createOrderDto);
    }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Patch('confirm/:id')
  async confirmOrder(@Param('id') id: string) {
    return this.orderService.confirmOrder(id);
  }

  @Patch('cancel/:id')
  async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  @Patch('update/:orderId')
  async updateOrder(@Param('orderId') orderId: string, @Body() updateOrderDto: CreateOrderDto) {
    return this.orderService.updateOrder(orderId, updateOrderDto);
  }
}
