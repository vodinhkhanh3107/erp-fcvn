import { IsEnum } from 'class-validator';
import { SupplierGroupStatus } from '../entities/supplier-group.entity';

export class UpdateSupplierGroupStatusDto {
  @IsEnum(SupplierGroupStatus)
  status: SupplierGroupStatus;
}