import { Module } from '@nestjs/common';
import { OutOfBandController } from './out-of-band.controller';
import { OutOfBandService } from './out-of-band.service';

@Module({
  controllers: [OutOfBandController],
  providers: [OutOfBandService]
})
export class OutOfBandModule {}
