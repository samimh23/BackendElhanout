import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.schema';
import { Product } from 'src/product/entities/product.schema';
import { Model, Types } from 'mongoose';
import { NormalMarket } from 'src/market/schema/normal-market.schema';
import { User } from 'src/users/Schemas/User.schema';
import axios from 'axios';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(NormalMarket.name) private shopModel: Model<NormalMarket>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createAnOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { normalMarket, products, user, dateOrder, isConfirmed ,totalPrice,orderStatus } = createOrderDto;
   const usr = await this.userModel.findById(user).exec();
    if (!usr) {
      throw new BadRequestException('User not found');
    }
    const payload = {
      "senderAccountId": usr.headerAccountId,
      "senderPrivateKey": usr.privateKey,
      "amount": totalPrice,
    }
    const response = await axios.post('http://localhost:3002/api/token/Lock' , payload);
    
    // Verify shop existence and its products
    const shopData = await this.shopModel
      .findById(normalMarket)
      .populate('products')
      .exec();
    if (!shopData) {
      throw new BadRequestException('Shop not found');
    }
  
    // Map shopData.products: if populated, use _id; if not, use the item directly.
    const shopProductIds = shopData.products.map((p: any) =>
      p._id ? p._id.toString() : p.toString()
    );
    if (!shopProductIds || shopProductIds.length === 0) {
      throw new BadRequestException('No products found in the shop.');
    }
  
    // Validate that each product in the order belongs to the shop.
    products.forEach((p) => {
      if (!shopProductIds.includes(p.productId)) {
        throw new BadRequestException(
          `Product ${p.productId} does not belong to this shop.`
        );
      }
    });
  
    // Create new order document
    const order = new this.orderModel({
      idOrder: Date.now().toString(), // generate a simple idOrder string
      normalMarket: new Types.ObjectId(normalMarket),
      user: new Types.ObjectId(user),
      products: products.map((p) => ({
        productId: new Types.ObjectId(p.productId),
        // Using p.stock since that's what your Postman JSON provides.
        // Consider renaming this field to 'quantity' in both DTO and code for clarity.
        quantity: p.stock,
      })),
      dateOrder: dateOrder ? new Date(dateOrder) : new Date(),
      isConfirmed: isConfirmed ?? false,
      orderStatus: orderStatus,
      totalPrice: totalPrice,
    });
  
    this.logger.log(
      `Creating order for shop: ${normalMarket} with products: ${JSON.stringify(products)}`
    );
  
    return order.save();
  }
  

  async findAll(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate('shop')
      .populate('products.productId')
      .exec();
  }

  async confirmOrder(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const user = await this.userModel.findById(order.user).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }
  
    if (order.isConfirmed) {
    
      throw new BadRequestException('Order is already confirmed');
    }
 const payload = {
        "receiverAccountId": user.headerAccountId,
        "amount": order.totalPrice,
      }
      const response = await axios.post('http://localhost:3002/api/token/Unlock' , payload);


      const payload1 = 
      {
          "senderAccountId": user.headerAccountId,
          "senderPrivateKey": user.privateKey,
          "receiverAccountId": "0.0.5820764",
          "amount": order.totalPrice,
        }
      const response1 = await axios.post('http://localhost:3002/api/token/transfer' , payload1);
    // Decrease stock for each ordered product
    for (const orderedProduct of order.products) {
      const product = await this.productModel.findById(orderedProduct.productId).exec();
      if (!product) {
        throw new BadRequestException(`Product not found: ${orderedProduct.productId}`);
      }

      if (product.stock < orderedProduct.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      product.stock -= orderedProduct.quantity;
      await product.save();
    }

    order.isConfirmed = true;
    return order.save();
  }

  async cancelOrder(id: string): Promise<{
    canceledOrder: Order;
    updatedProducts: { productId: string; newStock: number }[];
  }> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const updatedProducts: { productId: string; newStock: number }[] = [];

    // Restore stock if order was confirmed
    if (order.isConfirmed) {
      for (const orderedProduct of order.products) {
        const product = await this.productModel.findById(orderedProduct.productId).exec();
        if (!product) {
          throw new BadRequestException(`Product not found: ${orderedProduct.productId}`);
        }

        product.stock += orderedProduct.quantity;
        await product.save();

        updatedProducts.push({
          productId: orderedProduct.productId.toString(),
          newStock: product.stock,
        });
      }
    }

    // Remove the order (or update its confirmation status, depending on your business logic)
    await this.orderModel.deleteOne({ _id: id }).exec();

    return { canceledOrder: order, updatedProducts };
  }

  async updateOrder(id: string, updateOrderDto: CreateOrderDto): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Validate shop existence and products similar to createAnOrder
    const shopData = await this.shopModel
      .findById(updateOrderDto.normalMarket)
      .populate('products')
      .exec();
    if (!shopData) {
      throw new BadRequestException('Shop not found');
    }

    const shopProductIds = shopData.products?.map((p) => p._id?.toString());
    updateOrderDto.products.forEach((p) => {
      if (!shopProductIds.includes(p.productId)) {
        throw new BadRequestException(`Product ${p.productId} does not belong to this shop.`);
      }
    });

    order.normalMarket = new Types.ObjectId(updateOrderDto.normalMarket);
    order.user = new Types.ObjectId(updateOrderDto.user);
    order.products = updateOrderDto.products.map((p) => ({
      productId: new Types.ObjectId(p.productId),
      quantity: p.stock,
    }));
    order.dateOrder = updateOrderDto.dateOrder ? new Date(updateOrderDto.dateOrder) : new Date();
    order.isConfirmed = updateOrderDto.isConfirmed ?? false;

    return order.save();
  }

  async findOrdersByUserId(userId: string): Promise<Order[]> {
    this.logger.log(`Finding orders for user ID: ${userId}`);
    
    // Ensure the userId is treated as an ObjectId if necessary
    const orders = await this.orderModel.find({ user: new Types.ObjectId(userId) }).exec();
    
    if (orders.length === 0) {
      this.logger.warn(`No orders found for user ID: ${userId}`);
    } else {
      this.logger.log(`Found ${orders.length} orders for user ID: ${userId}`);
    }
    
    return orders;
  }

  async findOrdersByShopId(shopId: string): Promise<Order[]> {
    return this.orderModel.find({ shop: shopId }).exec();
  }

  async findOrderById(id: string): Promise<Order> {
    return this.orderModel.findById(id).exec();
  }
}
