import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { ListVersionsQueryDto } from './dto/requests/list-versions-query.dto';
import { VersionDto } from './dto/responses/version.dto';
import { VersionsService } from './versions.service';

@UseGuards(JwtAuthGuard)
@Controller('services/:serviceId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

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
}
