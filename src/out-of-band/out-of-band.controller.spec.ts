import { Test, TestingModule } from '@nestjs/testing';
import { OutOfBandController } from './out-of-band.controller';

describe('OutOfBandController', () => {
  let controller: OutOfBandController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutOfBandController],
    }).compile();

    controller = module.get<OutOfBandController>(OutOfBandController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
