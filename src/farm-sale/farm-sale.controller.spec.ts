import { Test, TestingModule } from '@nestjs/testing';
import { FarmSaleController } from './farm-sale.controller';
import { FarmSaleService } from './farm-sale.service';

describe('FarmSaleController', () => {
  let controller: FarmSaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmSaleController],
      providers: [FarmSaleService],
    }).compile();

    controller = module.get<FarmSaleController>(FarmSaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
