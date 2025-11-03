import { Test, TestingModule } from '@nestjs/testing';
import { VehicleTypeController } from './vehicle-type.controller';

describe('VehicleTypeController', () => {
  let controller: VehicleTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleTypeController],
    }).compile();

    controller = module.get<VehicleTypeController>(VehicleTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
