import { ApiProperty } from "@nestjs/swagger";
import { DepartmentStatus } from "../entities/department.entity";
import { IsEnum } from "class-validator";

export class UpdateDepartmentStatusDto {
  @ApiProperty({ enum: DepartmentStatus })
  @IsEnum(DepartmentStatus)
  status: DepartmentStatus;
}