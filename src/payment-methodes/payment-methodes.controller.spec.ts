import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodesController } from './payment-methodes.controller';

describe('PaymentMethodesController', () => {
  let controller: PaymentMethodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodesController],
    }).compile();

    controller = module.get<PaymentMethodesController>(PaymentMethodesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
