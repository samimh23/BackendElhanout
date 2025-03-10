import { Test, TestingModule } from '@nestjs/testing';
import { FarmCropController } from './farm-crop.controller';
import { FarmCropService } from './farm-crop.service';

describe('FarmCropController', () => {
  let controller: FarmCropController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmCropController],
      providers: [FarmCropService],
    }).compile();

    controller = module.get<FarmCropController>(FarmCropController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
