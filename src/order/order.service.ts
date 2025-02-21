import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './entities/order.schema';
import { Shop } from 'src/shop/entities/shop.schema';
import { Product } from 'src/product/entities/product.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Shop.name) private shopModel: Model<Shop>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async createAnOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { shop, products, iduser, dateOrder, isconfirmed } = createOrderDto;

    const shopData = await this.shopModel
      .findById(shop)
      .populate('products')
      .exec();
    if (!shopData) {
      throw new BadRequestException('Shop not found');
    }

    const shopProductIds = shopData.products?.map((p) => p._id?.toString());
    if (!shopProductIds || shopProductIds.length === 0) {
      throw new BadRequestException('No products found in the shop.');
    }

    products.forEach((p) => {
      if (!shopProductIds.includes(p.productId)) {
        throw new BadRequestException(
          `Product ${p.productId} does not belong to this shop.`,
        );
      }
    });

    const order = new this.orderModel({
      shop: new Types.ObjectId(shop),
      iduser: new Types.ObjectId(iduser),
      products: products.map((p) => ({
        productId: new Types.ObjectId(p.productId),
        quantity: p.quantity,
      })),
      dateOrder: dateOrder || new Date(),
      isconfirmed: isconfirmed ?? false,
    });

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

    if (order.isconfirmed) {
      throw new BadRequestException('Order is already confirmed');
    }

    for (const orderedProduct of order.products) {
      const product = await this.productModel
        .findById(orderedProduct.productId)
        .exec();
      if (!product) {
        throw new BadRequestException(
          `Product not found: ${orderedProduct.productId}`,
        );
      }

      if (product.stock < orderedProduct.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }

      product.stock -= orderedProduct.quantity;
      await product.save();
    }

    order.isconfirmed = true;
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

    if (order.isconfirmed) {
      for (const orderedProduct of order.products) {
        const product = await this.productModel
          .findById(orderedProduct.productId)
          .exec();
        if (!product) {
          throw new BadRequestException(
            `Product not found: ${orderedProduct.productId}`,
          );
        }

        product.stock += orderedProduct.quantity;
        await product.save();

        updatedProducts.push({
          productId: orderedProduct.productId.toString(),
          newStock: product.stock,
        });
      }
    }

    order.isconfirmed = false;

    await this.orderModel.deleteOne({ _id: id }).exec();

    return { canceledOrder: order, updatedProducts };
  }

  async updateOrder(
    id: string,
    updateOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }

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
        throw new BadRequestException(
          `Product ${p.productId} does not belong to this shop.`,
        );
      }
    });

    order.shop = new Types.ObjectId(updateOrderDto.shop);
    order.iduser = new Types.ObjectId(updateOrderDto.iduser);
    order.products = updateOrderDto.products.map((p) => ({
      productId: new Types.ObjectId(p.productId),
      quantity: p.quantity,
    }));
    order.dateOrder = updateOrderDto.dateOrder
      ? new Date(updateOrderDto.dateOrder)
      : new Date();
    order.isconfirmed = updateOrderDto.isconfirmed ?? false;

    return order.save();
  }
}
