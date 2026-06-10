import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DecisionRole, DecisionType } from '../../common/enums';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { User } from '../users/user.entity';

@Entity('request_decisions')
export class RequestDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_request_id' })
  trainingRequestId: string;

  @ManyToOne(() => TrainingRequest, (request) => request.decisions)
  @JoinColumn({ name: 'training_request_id' })
  trainingRequest: TrainingRequest;

  @Column({ name: 'decided_by' })
  decidedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'decided_by' })
  decidedByUser: User;

  @Column({ name: 'decision_role', type: 'enum', enum: DecisionRole })
  decisionRole: DecisionRole;

  @Column({ type: 'enum', enum: DecisionType })
  decision: DecisionType;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
