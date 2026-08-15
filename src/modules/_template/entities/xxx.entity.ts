import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// ĐỔI TÊN: XxxEntity -> tên thật (vd. Task, Department...)
// ĐỔI TÊN: 'xxx_table' -> tên bảng thật (vd. 'tasks')
@Entity('xxx_table')
export class XxxEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
