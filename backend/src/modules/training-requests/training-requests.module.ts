import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingRequestsController } from './training-requests.controller';
import { TrainingRequestsService } from './training-requests.service';
import { TrainingRequest } from './training-request.entity';
import { TrainingRequestParticipant } from './training-request-participant.entity';
import { User } from '../users/user.entity';
import { WorkflowModule } from '../workflow/workflow.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingRequest, TrainingRequestParticipant, User]),
    WorkflowModule,
    NotificationsModule,
  ],
  controllers: [TrainingRequestsController],
  providers: [TrainingRequestsService],
  exports: [TrainingRequestsService],
})
export class TrainingRequestsModule {}
