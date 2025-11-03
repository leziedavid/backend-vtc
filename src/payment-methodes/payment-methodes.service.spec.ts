import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodesService } from './payment-methodes.service';

describe('PaymentMethodesService', () => {
  let service: PaymentMethodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodesService],
    }).compile();

    service = module.get<PaymentMethodesService>(PaymentMethodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
