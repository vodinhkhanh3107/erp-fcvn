import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum KpiStatus {
  ON_TRACK = 'On-track',
  OFF_TRACK = 'Off-track',
}

@Entity('kpis')
export class Kpi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  period?: string;

  @Column({ name: 'target_value', type: 'decimal', precision: 18, scale: 2 })
  targetValue: number;

  @Column({ name: 'actual_value', type: 'decimal', precision: 18, scale: 2 })
  actualValue: number;

  @Column({ name: 'kpi_status', type: 'enum', enum: KpiStatus })
  kpiStatus: KpiStatus;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
