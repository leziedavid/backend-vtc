import { Test, TestingModule } from '@nestjs/testing';
import { TrajetController } from './trajet.controller';

describe('TrajetController', () => {
  let controller: TrajetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrajetController],
    }).compile();

    controller = module.get<TrajetController>(TrajetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
