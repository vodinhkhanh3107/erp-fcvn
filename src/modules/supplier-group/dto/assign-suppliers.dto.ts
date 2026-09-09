import { ArrayNotEmpty, IsInt } from 'class-validator';

export class AssignSuppliersDto {
  @ArrayNotEmpty({ message: 'supplierIds phải có ít nhất 1 phần tử' })
  @IsInt({ each: true })
  supplierIds: number[];
}
