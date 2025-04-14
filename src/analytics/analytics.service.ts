// analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../order/entities/order.schema';
import { Analytics } from './schema/analytics.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Analytics.name) private analyticsModel: Model<Analytics>,
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('NormalMarket') private marketModel: Model<any>
  ) {}

  async createAnalyticsRecord(order: Order) {
    try {
      // Populate necessary data
      const [user, market, products] = await Promise.all([
        this.userModel.findById(order.user).exec(),
        this.marketModel.findById(order.normalMarket).exec(),
        this.productModel.find({
          _id: { $in: order.products.map(p => p.productId) }
        }).exec()
      ]);

      // Calculate category breakdown
      const categories = order.products.reduce((acc, orderProduct) => {
        const product = products.find(p => p._id.equals(orderProduct.productId));
        const category = product?.category || 'N/A';
        const amount = (product?.originalPrice || 0) * orderProduct.quantity;
        
        const existing = acc.find(item => item.category === category);
        if (existing) {
          existing.amount += amount;
        } else {
          acc.push({ category, amount });
        }
        return acc;
      }, [] as {category: string; amount: number}[]);

      // Create analytics record
      const analyticsRecord = new this.analyticsModel({
        orderId: order._id,
        marketId: order.normalMarket,
        userId: order.user,
        customerAge: user?.age || 0,
        customerGender: user?.gender || 'unknown',
        purchaseAmount: order.totalPrice,
        location: market?.marketLocation || 'unknown',
        season: this.getSeason(order.dateOrder),
        categories,
        orderDate: order.dateOrder
      });

      return analyticsRecord.save();
    } catch (error) {
      console.error('Error creating analytics record:', error);
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
}