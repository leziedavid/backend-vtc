import { Test, TestingModule } from '@nestjs/testing';
import { PubliciteService } from './publicite.service';

describe('PubliciteService', () => {
  let service: PubliciteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PubliciteService],
    }).compile();

    service = module.get<PubliciteService>(PubliciteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
