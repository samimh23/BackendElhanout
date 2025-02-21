import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Shop } from './entities/shop.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from 'src/product/entities/product.schema';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Shop.name) private shopModel: Model<Shop>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createShopDto: CreateShopDto): Promise<Shop> {
    const shop = new this.shopModel(createShopDto);
    const user = await this.userModel.findById('67a5024615302e94a18e750d');
    if (!user) {
      throw new Error('User not found');
    }
    const newShop = new this.shopModel({
      ...createShopDto,
      owner: user._id,
    });
    return newShop.save();
  }

  async findAll(): Promise<Shop[]> {
    return this.shopModel.find().exec();
  }

  async findOne(id: String): Promise<Shop> {
    return this.shopModel.findById(id).exec();
  }

  update(id: String, updateShopDto: UpdateShopDto) {
    return this.shopModel.findByIdAndUpdate(id, updateShopDto).exec();
  }

  async remove(id: String): Promise<String> {
    var shop = await this.shopModel.findById(id);

    await this.shopModel.findByIdAndDelete(id);

    return ` ${shop.name} has been deleted`;
  }
}
