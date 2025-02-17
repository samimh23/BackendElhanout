import { Test, TestingModule } from '@nestjs/testing';
import { WholesalerMarketController } from './wholesaler_market.controller';
import { WholesalerMarketService } from './wholesaler_market.service';

describe('WholesalerMarketController', () => {
  let controller: WholesalerMarketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WholesalerMarketController],
      providers: [WholesalerMarketService],
    }).compile();

    controller = module.get<WholesalerMarketController>(WholesalerMarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
