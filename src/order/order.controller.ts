import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarketOrderCropDto } from './dto/market-order_crop.dto';
import { MarketOrderDto } from './dto/market-order.dtl';
import { Order } from './entities/order.schema';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createAnOrder(createOrderDto);
  }

  @Post('createOrder')
  async createOrderFromFarm(@Body() createOrder: MarketOrderDto) {
    return this.orderService.createFarmOrder(createOrder);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

   @Get('between-normal-and-farm/:normalMarketId')
  async getOrdersBetweenNormalAndFarmMarket(
    @Param('normalMarketId') normalMarketId: string,
  ): Promise<Order[]> {
    return this.orderService.getOrdersBetweenNormalAndFarmMarket(normalMarketId);
  }

  @Patch('confirm/:id')
  async confirmOrder(@Param('id') id: string) {
    return this.orderService.confirmOrder(id);
  }
    @Patch(':id/confirm')
  async confirmMarketOrder(@Param('id') id: string): Promise<Order> {
    const order = await this.orderService.confirmMarketOrder(id);
    return order;
  }
  @Patch('cancel/:id')
  async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  @Patch('update/:orderId')
  async updateOrder(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: CreateOrderDto, // using same DTO for update
  ) {
    return this.orderService.updateOrder(orderId, updateOrderDto);
  }

  @Get(':userId')
  async findOrdersByUserId(@Param('userId') userId: string) {
    return await this.orderService.findOrdersByUserId(userId);
  }

  @Get('findOrder/:id')
  async findOrderById(@Param('id') id: string) {
    return await this.orderService.findOrderById(id);
  }

  @Patch('updateStatus/:id')
  async updateOrderStatus(
    @Param('id') id: string){
    return await this.orderService.sendPackage(id);
    }

    @Get('shop/:shopId')
  async findOrdersByShopId(@Param('shopId') shopId: string) {
   
      return await this.orderService.findOrdersByShopId(shopId);
    
  }

  
  @Post('cropsOrder')
  async orderCropFromFarm(@Body() marketOrderCropDto: MarketOrderCropDto) {
    return this.orderService.orderCropFromFarm(marketOrderCropDto);
  }
}
