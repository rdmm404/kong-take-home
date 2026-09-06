import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from './service.entity';

@Entity({ name: 'versions' })
@Unique('UQ_versions_service_id_version', ['serviceId', 'version'])
@Index('IDX_versions_service_id', ['serviceId'])
@Index('IDX_versions_created_at', ['createdAt'])
export class Version {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_id', type: 'integer' })
  serviceId: number;

  @Column({ type: 'varchar', length: 255 })
  version: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Service, (service) => service.versions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
