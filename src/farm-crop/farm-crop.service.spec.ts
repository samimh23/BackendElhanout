import { Test, TestingModule } from '@nestjs/testing';
import { FarmCropService } from './farm-crop.service';

describe('FarmCropService', () => {
  let service: FarmCropService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FarmCropService],
    }).compile();

    service = module.get<FarmCropService>(FarmCropService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
