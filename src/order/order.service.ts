import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.schema';
import { Shop } from 'src/shop/entities/shop.schema';
import { Product } from 'src/product/entities/product.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Shop.name) private shopModel: Model<Shop>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async createAnOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { shop, products, user, dateOrder, isConfirmed } = createOrderDto;
  
    // Verify shop existence and its products
    const shopData = await this.shopModel
      .findById(shop)
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
      shop: new Types.ObjectId(shop),
      user: new Types.ObjectId(user),
      products: products.map((p) => ({
        productId: new Types.ObjectId(p.productId),
        // Using p.stock since that's what your Postman JSON provides.
        // Consider renaming this field to 'quantity' in both DTO and code for clarity.
        quantity: p.stock,
      })),
      dateOrder: dateOrder ? new Date(dateOrder) : new Date(),
      isConfirmed: isConfirmed ?? false,
    });
  
    this.logger.log(
      `Creating order for shop: ${shop} with products: ${JSON.stringify(products)}`
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

    if (order.isConfirmed) {
      throw new BadRequestException('Order is already confirmed');
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
      .findById(updateOrderDto.shop)
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

    order.shop = new Types.ObjectId(updateOrderDto.shop);
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
