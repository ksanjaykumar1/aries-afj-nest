import { Test, TestingModule } from '@nestjs/testing';
import { OutOfBandService } from './out-of-band.service';

describe('OutOfBandService', () => {
  let service: OutOfBandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutOfBandService],
    }).compile();

    service = module.get<OutOfBandService>(OutOfBandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
