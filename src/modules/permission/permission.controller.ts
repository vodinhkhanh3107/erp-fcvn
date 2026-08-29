import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { RequirePermission } from "src/common/decorators/permission.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionGuard } from "src/common/guards/permission.guard";
import { PermissionService } from "./permission.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { PERMISSIONS } from "src/common/constants/permission.constants";

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
// @RequirePermission(PERMISSIONS.)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }
}