import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { RequestDecision } from './request-decision.entity';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { User } from '../users/user.entity';
import { WorkflowModule } from '../workflow/workflow.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestDecision, TrainingRequest, User]),
    WorkflowModule,
    NotificationsModule,
  ],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
