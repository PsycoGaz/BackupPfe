import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ParticipantStatus } from '../../common/enums';
import { TrainingRequest } from './training-request.entity';
import { User } from '../users/user.entity';

@Entity('training_request_participants')
export class TrainingRequestParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_request_id' })
  trainingRequestId: string;

  @ManyToOne(() => TrainingRequest, (request) => request.participants)
  @JoinColumn({ name: 'training_request_id' })
  trainingRequest: TrainingRequest;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'participant_status',
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PENDING,
  })
  participantStatus: ParticipantStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
