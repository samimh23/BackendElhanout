import { Test, TestingModule } from '@nestjs/testing';
import { WholesalerMarketService } from './wholesaler_market.service';

describe('WholesalerMarketService', () => {
  let service: WholesalerMarketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WholesalerMarketService],
    }).compile();

    service = module.get<WholesalerMarketService>(WholesalerMarketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
