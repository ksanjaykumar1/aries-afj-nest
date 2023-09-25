import { Module } from '@nestjs/common';
import { AriesService } from './aries.service';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from 'src/config.schema';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.dev`],
      validationSchema: configValidationSchema,
    }),
    PrismaModule,
  ],
  providers: [AriesService],
  exports: [AriesService],
})
export class AriesModule {}
