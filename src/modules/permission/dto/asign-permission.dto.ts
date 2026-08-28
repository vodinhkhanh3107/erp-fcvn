import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsString } from "class-validator";

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], example: ['user.manage', 'task.manage'] })
  @ArrayNotEmpty({ message: 'permissionCodes phải có ít nhất 1 phần tử' })
  @IsString({ each: true })
  permissionCodes: string[];
}