import * as bcrypt from 'bcrypt';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/constants/role.enum';
import { Department } from 'src/modules/department/entities/department.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 15, unique: true, nullable: true })
  phone?: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'refresh_token_hash', select: false, nullable: true })
  refreshTokenHash?: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.EMPLOYEE })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;
  

  @Column({ name: "avatar", default: "" })
  avatar: string;

  // @Column({ name: 'job_title', length: 255, nullable: true })
  // jobTitle?: string;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: number;
 
  @ManyToOne(() => Department, (department) => department.users, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;
 
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordIfChanged() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}