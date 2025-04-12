import { Test, TestingModule } from '@nestjs/testing';
import { FarmSaleService } from './farm-sale.service';

describe('FarmSaleService', () => {
  let service: FarmSaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FarmSaleService],
    }).compile();

    service = module.get<FarmSaleService>(FarmSaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
