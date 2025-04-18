import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.schema';
import { Product } from 'src/product/entities/product.schema';
import { Model, Types } from 'mongoose';
import { NormalMarket } from 'src/market/schema/normal-market.schema';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from 'json2csv';
import { User } from 'src/users/Schemas/User.schema';

export interface PopulatedOrder extends Omit<Order, 'user' | 'normalMarket' | 'products'> {
  user: User;
  normalMarket: NormalMarket;
  products: {
    productId: Product;
    quantity: number;
  }[];
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(NormalMarket.name) private shopModel: Model<NormalMarket>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    // Create orders directory if it doesn't exist
    const ordersDir = path.join(__dirname, '..', '..', 'orders');
    if (!fs.existsSync(ordersDir)) {
      fs.mkdirSync(ordersDir, { recursive: true });
    }
  }

  async createAnOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { normalMarket, products, user, dateOrder, isConfirmed } = createOrderDto;
  
    console.log(`Processing order for user: ${user}`);
  
    try {
      const userData = await this.userModel.findById(user).exec();
      if (userData) {
        console.log('User age and gender:', {
          userId: userData._id.toString(),
          age: userData.age,
          gender: userData.gender,
        });
      } else {
        console.log(`User with ID ${user} not found`);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
    
    const shopData = await this.shopModel
      .findById(normalMarket)
      .populate('products')
      .exec();
    if (!shopData) {
      throw new BadRequestException('Shop not found');
    }
  
    const shopProductIds = shopData.products.map((p: any) =>
      p._id ? p._id.toString() : p.toString()
    );
    if (!shopProductIds || shopProductIds.length === 0) {
      throw new BadRequestException('No products found in the shop.');
    }
  
    products.forEach((p) => {
      if (!shopProductIds.includes(p.productId)) {
        throw new BadRequestException(
          `Product ${p.productId} does not belong to this shop.`
        );
      }
    });
  
    const order = new this.orderModel({
      idOrder: Date.now().toString(),
      normalMarket: new Types.ObjectId(normalMarket),
      user: new Types.ObjectId(user),
      products: products.map((p) => ({
        productId: new Types.ObjectId(p.productId),
        quantity: p.stock,
      })),
      dateOrder: dateOrder ? new Date(dateOrder) : new Date(),
      isConfirmed: isConfirmed ?? false,
    });
  
    this.logger.log(
      `Creating order for shop: ${normalMarket} with products: ${JSON.stringify(products)}`
    );
  
    const savedOrder = await order.save();

    await this.appendOrderToCSV(savedOrder);

    return savedOrder;  
  }

  private async appendOrderToCSV(order: Order) {
    try {
      console.log('Processing order ID:', order._id.toString());
      
      const populatedOrderDoc = await this.orderModel
        .findById(order._id)
        .populate({
          path: 'user',
          select: '_id age gender email name'
        })
        .populate({
          path: 'products.productId',
          select: 'originalPrice category name _id'
        })
        .populate('normalMarket')
        .exec();
      
      const populatedOrder = populatedOrderDoc as unknown as PopulatedOrder;
  
      console.log('DETAILED PRODUCT INFO:');
      populatedOrder.products.forEach((item, index) => {
        console.log(`Product ${index + 1}:`, {
          id: item.productId._id?.toString(),
          name: item.productId.name,
          originalPrice: item.productId.originalPrice,
          originalPriceValue: Number(item.productId.originalPrice),
          originalPriceType: typeof item.productId.originalPrice,
          quantity: item.quantity,
          quantityType: typeof item.quantity,
          calculation: (Number(item.productId.originalPrice) || 0) * Number(item.quantity),
          category: item.productId.category
        });
      });
      
      const purchaseAmount = populatedOrder.products.reduce((total, item) => {
        const price = Number(item.productId.originalPrice) || 0;
        const qty = Number(item.quantity) || 0;
        const lineTotal = price * qty;
        console.log(`Line calculation: ${price} * ${qty} = ${lineTotal}`);
        return total + lineTotal;
      }, 0);
      
      console.log('Purchase Amount:', purchaseAmount);
      
      const categories = populatedOrder.products
        .map(p => p.productId.category || 'N/A')
        .join(';');
      
      const orderData = {
        'Customer ID': populatedOrder.user?._id?.toString(),
        'Age': populatedOrder.user?.age || 'N/A',
        'Gender': populatedOrder.user?.gender || 'N/A',
        'Purchase Amount (USD)': purchaseAmount.toFixed(2),
        'Location': populatedOrder.normalMarket?.marketLocation || 'N/A',
        'Season': this.getSeason(new Date(populatedOrder.dateOrder)),
        'Payment Method': 'Cash on Delivery',
        'Category': categories,
        'Order Date': new Date().toISOString()
      };
      
      const fields = Object.keys(orderData);
      
      // Create market-specific CSV file path
      const marketId = (populatedOrder.normalMarket as NormalMarket & { _id: Types.ObjectId })._id.toString();     
       const csvFilePath = path.join(__dirname, '..', '..', 'orders', `market_${marketId}.csv`);
      
      const fileExists = fs.existsSync(csvFilePath);
      const fileStats = fileExists ? fs.statSync(csvFilePath) : null;
      const isEmpty = fileExists ? fileStats.size === 0 : true;
      
      let csvOutput: string;
      if (!fileExists || isEmpty) {
        const parser = new Parser({ fields });
        csvOutput = parser.parse(orderData);
      } else {
        const parser = new Parser({ fields, header: false });
        csvOutput = parser.parse(orderData);
      }
      
      const stream = fs.createWriteStream(csvFilePath, { 
        flags: fileExists ? 'a' : 'w' 
      });
      
      stream.write(csvOutput + '\n');
      stream.end();
      
      console.log(`CSV write complete for market ${marketId} with purchase amount: ${purchaseAmount.toFixed(2)}`);
    } catch (error) {
      this.logger.error('Error appending order to CSV:', error);
      throw error;
    }
  }
  
  private getSeason(date: Date): string {
    const month = date.getMonth() + 1;
    if ([12, 1, 2].includes(month)) return 'Winter';
    if ([3, 4, 5].includes(month)) return 'Spring';
    if ([6, 7, 8].includes(month)) return 'Summer';
    return 'Fall';
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

    if (order.isConfirmed) {
      throw new BadRequestException('Order is already confirmed');
    }

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

    await this.orderModel.deleteOne({ _id: id }).exec();

    return { canceledOrder: order, updatedProducts };
  }

  async updateOrder(id: string, updateOrderDto: CreateOrderDto): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }

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
    return this.orderModel.find({ user: userId }).exec();
  }

  async findOrdersByShopId(shopId: string): Promise<Order[]> {
    return this.orderModel.find({ shop: shopId }).exec();
  }
}