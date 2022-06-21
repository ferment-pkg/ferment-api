import { Test, TestingModule } from '@nestjs/testing';
import { PrebuildsGateway } from './prebuilds.gateway';

describe('PrebuildsGateway', () => {
  let gateway: PrebuildsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrebuildsGateway],
    }).compile();

    gateway = module.get<PrebuildsGateway>(PrebuildsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
