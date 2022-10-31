import { Test, TestingModule } from '@nestjs/testing';
import { BarrellsController } from './barrells.controller';

describe('BarrellsController', () => {
  let controller: BarrellsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarrellsController],
    }).compile();

    controller = module.get<BarrellsController>(BarrellsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
