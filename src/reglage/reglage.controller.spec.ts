import { Test, TestingModule } from '@nestjs/testing';
import { ReglageController } from './reglage.controller';

describe('ReglageController', () => {
  let controller: ReglageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReglageController],
    }).compile();

    controller = module.get<ReglageController>(ReglageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
