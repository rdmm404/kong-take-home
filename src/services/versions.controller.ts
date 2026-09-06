import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginatedResponseDto } from '../common/dto/responses/paginated-response.dto';
import { ListVersionsQueryDto } from './dto/requests/list-versions-query.dto';
import { VersionDto } from './dto/responses/version.dto';
import { VersionsService } from './versions.service';

@UseGuards(JwtAuthGuard)
@Controller('services/:serviceId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  listVersions(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query() query: ListVersionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<VersionDto>> {
    return this.versionsService.listVersions(serviceId, query, user.tenantId);
  }
}
