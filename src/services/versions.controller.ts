import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginatedResponseDto } from '../common/pagination/paginated-response.dto';
import {
  createPaginatedResponse,
  pageToOffsetPagination,
} from '../common/pagination/pagination';
import { CreateVersionDto } from './dto/requests/create-version.dto';
import { ListVersionsQueryDto } from './dto/requests/list-versions-query.dto';
import { UpdateVersionDto } from './dto/requests/update-version.dto';
import { VersionDto } from './dto/responses/version.dto';
import { VersionsService } from './versions.service';

@UseGuards(JwtAuthGuard)
@Controller('services/:serviceId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Post()
  createVersion(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() body: CreateVersionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VersionDto> {
    return this.versionsService.createVersion(serviceId, body, user.tenantId);
  }

  @Get()
  async listVersions(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query() query: ListVersionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<PaginatedResponseDto<VersionDto>> {
    const pagination = { page: query.page, perPage: query.perPage };
    const result = await this.versionsService.listVersions(
      serviceId,
      pageToOffsetPagination(pagination),
      user.tenantId,
    );

    return createPaginatedResponse(result, pagination, request.originalUrl);
  }

  @Patch(':versionId')
  updateVersion(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() body: UpdateVersionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VersionDto> {
    return this.versionsService.updateVersion(
      serviceId,
      versionId,
      body,
      user.tenantId,
    );
  }

  @Delete(':versionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVersion(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.versionsService.deleteVersion(
      serviceId,
      versionId,
      user.tenantId,
    );
  }
}
