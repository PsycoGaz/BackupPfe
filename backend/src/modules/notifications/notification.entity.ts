import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  REQUEST_SUBMITTED = 'REQUEST_SUBMITTED',
  REQUEST_APPROVED_MANAGER = 'REQUEST_APPROVED_MANAGER',
  REQUEST_REJECTED_MANAGER = 'REQUEST_REJECTED_MANAGER',
  REQUEST_APPROVED_RH = 'REQUEST_APPROVED_RH',
  REQUEST_REJECTED_RH = 'REQUEST_REJECTED_RH',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  REQUEST_NEEDS_VALIDATION = 'REQUEST_NEEDS_VALIDATION',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 500 })
  message: string;

  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId: string | null;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
