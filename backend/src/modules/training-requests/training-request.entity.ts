import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {
  RequestType,
  RequestScope,
  RequestStatus,
} from '../../common/enums';
import { User } from '../users/user.entity';
import { Formation } from '../formations/formation.entity';
import { TrainingRequestParticipant } from './training-request-participant.entity';
import { RequestDecision } from '../decisions/request-decision.entity';

@Entity('training_requests')
export class TrainingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_type', type: 'enum', enum: RequestType })
  requestType: RequestType;

  @Column({
    name: 'request_scope',
    type: 'enum',
    enum: RequestScope,
    default: RequestScope.INDIVIDUAL,
  })
  requestScope: RequestScope;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, (user) => user.trainingRequests)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'formation_id', type: 'uuid', nullable: true })
  formationId: string | null;

  @ManyToOne(() => Formation, { nullable: true })
  @JoinColumn({ name: 'formation_id' })
  formation: Formation | null;

  @Column({ name: 'custom_formation_name', type: 'varchar', length: 255, nullable: true })
  customFormationName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  domain: string | null;

  @Column({ name: 'desired_start_date', type: 'date' })
  desiredStartDate: string;

  @Column({ name: 'desired_end_date', type: 'date', nullable: true })
  desiredEndDate: string | null;

  @Column({ type: 'text', nullable: true })
  justification: string | null;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.BROUILLON,
  })
  status: RequestStatus;

  @Column({ name: 'camunda_process_instance_id', type: 'varchar', nullable: true })
  camundaProcessInstanceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
    () => TrainingRequestParticipant,
    (participant) => participant.trainingRequest,
  )
  participants: TrainingRequestParticipant[];

  @OneToMany(() => RequestDecision, (decision) => decision.trainingRequest)
  decisions: RequestDecision[];
}
