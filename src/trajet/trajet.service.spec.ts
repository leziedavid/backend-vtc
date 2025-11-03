import { Test, TestingModule } from '@nestjs/testing';
import { TrajetService } from './trajet.service';

describe('TrajetService', () => {
  let service: TrajetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrajetService],
    }).compile();

    service = module.get<TrajetService>(TrajetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
