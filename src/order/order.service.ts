import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from './entities/order.schema';
import { Product } from 'src/product/entities/product.schema';
import { Model, Types } from 'mongoose';
import { NormalMarket } from 'src/market/schema/normal-market.schema';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from 'json2csv';
import { User } from 'src/users/Schemas/User.schema';
import axios from 'axios';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { MarketOrderCropDto } from './dto/market-order_crop.dto';
import { FarmCrop } from 'src/farm-crop/Schema/farm-crop.schema';
import { Sale } from 'src/farm-sale/Schema/farm-sale.schema';
import { ProductCategory } from 'src/product/entities/category.enum';


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
    private analyticsService: AnalyticsService,
    @InjectModel(NormalMarket.name) private shopModel: Model<NormalMarket>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FarmCrop.name) private farmCropModel: Model<FarmCrop>,
    @InjectModel(Sale.name) private saleModel: Model<Sale>,
  ) {
    
  }

  async createAnOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { normalMarket, products, user, dateOrder, isConfirmed,totalPrice,orderStatus } = createOrderDto;
  
    console.log(`Processing order for user: ${user}`);
  
    try {
      const userData = await this.userModel.findById(user).exec();
      const payload = {
        "senderAccountId": userData.headerAccountId,
        "senderPrivateKey": userData.privateKey,
        "amount": totalPrice,
      }
      console.log('Payload for Lock:', payload);
      const response = await axios.post('https://hserv.onrender.com/api/token/Lock' , payload);
console.log('Lock response:', response.data);
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
      orderStatus: orderStatus ,
      totalPrice: totalPrice ,
    });
  
    this.logger.log(
      `Creating order for shop: ${normalMarket} with products: ${JSON.stringify(products)}`
    );
  
    const savedOrder = await order.save();

    //await this.appendOrderToCSV(savedOrder);
    this.analyticsService.createAnalyticsRecord(savedOrder)

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

    const sellingshop = await this.shopModel.findById(order.normalMarket.id).exec();
    console.log(sellingshop)
    
    const soldProducts = await Promise.all(
      order.products.map(async (product) => {
        return this.productModel.findById(product.productId).exec();
      })
    );
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
      const response = await axios.post('https://hserv.onrender.com/api/token/Unlock' , payload);


      const payload1 = 
      {
          "senderAccountId": user.headerAccountId,
          "senderPrivateKey": user.privateKey,
          "receiverAccountId": sellingshop.marketWalletPublicKey,
          "amount": order.totalPrice,
          
        }
      const response1 = await axios.post('https://hserv.onrender.com/api/token/transfer' , payload1);

      for (const product of soldProducts) {

        const amountkg = order.totalPrice / product.originalPrice;
        const newpayload =
        {
          "tokenId": product.tokenid,
          "amountKg": amountkg,
          "sellerAccountId": sellingshop.marketWalletPublicKey,
          "sellerPrivateKey":sellingshop.marketWalletSecretKey,
          "buyerAccountId": user.headerAccountId,
          "buyerPrivateKey": user.privateKey
        }
      const response2 = await axios.post('https://hedera-token.onrender.com/api/tokens/sell' , newpayload);
      }
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

    const shopProductIds = shopData.products?.map((p) => p.id?.toString());
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

 

  async findOrderById(id: string): Promise<Order> {
    return this.orderModel.findById(id).exec();
  }

  async sendPackage(id: string): Promise<Order> {
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
 
    
    order.orderStatus = OrderStatus.DELIVERING
    return order.save();
  }

  async findOrdersByShopId(shopId: string): Promise<Order[]> {
    
      
    
      const orders = await this.orderModel.find({ 
        normalMarket: new Types.ObjectId(shopId) 
      }).exec();
      
      return orders;
    
     
    
  }

  async orderCropFromFarm(marketOrderCropDto: MarketOrderCropDto): Promise<Product> {
    const { saleId, marketId, quantity, pricePerUnit } = marketOrderCropDto;

    // Check if market exists
    const market = await this.shopModel.findById(marketId).exec();
    if (!market) {
      throw new NotFoundException(`Market with ID ${marketId} not found`);
    }
    
    // Check if farm crop exists
    const sale = await this.saleModel.findById(saleId).exec();
    if (!sale) {
      throw new NotFoundException(`Farm crop with ID ${saleId} not found`);
    }
    const farmCrop = await this.farmCropModel.findById(sale.farmCropId).exec();
    if (!farmCrop) {
      throw new NotFoundException(`Farm crop with ID ${sale.farmCropId} not found`);
    }

    // Check if crop has enough quantity
    if (!sale.quantity || sale.quantity < quantity) {
      throw new BadRequestException(`Insufficient sale quantity. Available: ${sale.quantity}`);
    }
    
    // Transform crop to product and add to market
    const newProduct = new this.productModel({
      name: farmCrop.productName,
      description: `Product derived from ${farmCrop.productName} crop`,
      originalPrice: pricePerUnit || 15, // Add markup for retail price
      price: pricePerUnit ? pricePerUnit * 1.2 : 18, // 20% markup for final price
      category: farmCrop.type,
      stock: quantity,
      image: farmCrop.picture || 'default-product.jpg',
      shop: new Types.ObjectId(market._id),
      isActive: true,
    });

    return newProduct.save();
  }

  
}
