import { IsEnum } from 'class-validator';
import { SupplierGroupStatus } from '../../../models/supplier-group.entity';

export class UpdateSupplierGroupStatusDto {
  @IsEnum(SupplierGroupStatus)
  status: SupplierGroupStatus;
}