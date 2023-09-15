import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AriesModule } from './aries/aries.module';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config.schema';
import { AriesService } from './aries/aries.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.dev`],
      validationSchema: configValidationSchema,
    }),
    AriesModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private ariesService: AriesService) {
    this.ariesService.run();
  }
}
