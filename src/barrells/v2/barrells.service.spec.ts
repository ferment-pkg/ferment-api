import { Test, TestingModule } from '@nestjs/testing';
import { BarrellsService } from './barrells.service';

describe('BarrellsService', () => {
  let service: BarrellsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarrellsService],
    }).compile();

    service = module.get<BarrellsService>(BarrellsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
