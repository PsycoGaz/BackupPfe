import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { Formation } from '../formations/formation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingRequest, Formation])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
