import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Suy ra từ HTTP method: POST->CREATE, PUT/PATCH->UPDATE, DELETE->DELETE
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'actor_id' })
  @Index()
  actorId: number;

  @Column({ name: 'actor_role', length: 50 })
  actorRole: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'entity_type', length: 100 })
  @Index()
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  @Index()
  entityId?: number;

  @Column({ length: 10 })
  method: string; 

  @Column({ length: 500 })
  path: string;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody?: string;

  @Column({ name: 'status_code' })
  statusCode: number;

  @Column()
  success: boolean;

  @Column({ name: 'error_message', length: 500, nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}