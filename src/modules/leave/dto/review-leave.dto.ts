import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { LeaveStatus } from "src/models/leave.entity";

export class ReviewLeaveDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsEnum(LeaveStatus)
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
}