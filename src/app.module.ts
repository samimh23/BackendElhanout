import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { ShopModule } from './shop/shop.module';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './order/order.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://127.0.0.1:27017/El_Hanout')
    
    ,AuthModule, UserModule, ProductModule, ShopModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
