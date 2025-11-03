import { Test, TestingModule } from '@nestjs/testing';
import { PubliciteController } from './publicite.controller';

describe('PubliciteController', () => {
  let controller: PubliciteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PubliciteController],
    }).compile();

    controller = module.get<PubliciteController>(PubliciteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
