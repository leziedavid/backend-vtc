import { Test, TestingModule } from '@nestjs/testing';
import { ReglageService } from './reglage.service';

describe('ReglageService', () => {
  let service: ReglageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReglageService],
    }).compile();

    service = module.get<ReglageService>(ReglageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
