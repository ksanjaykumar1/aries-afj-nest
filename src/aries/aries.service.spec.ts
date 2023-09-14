import { Test, TestingModule } from '@nestjs/testing';
import { AriesService } from './aries.service';

describe('AriesService', () => {
  let service: AriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AriesService],
    }).compile();

    service = module.get<AriesService>(AriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
