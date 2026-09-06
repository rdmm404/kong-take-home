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
import { ListServicesQueryDto } from './dto/requests/list-services-query.dto';
import { ServiceDetailDto } from './dto/responses/service-detail.dto';
import { ServiceListItemDto } from './dto/responses/service-list-item.dto';
import { ServicesService } from './services.service';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async listServices(
    @Query() query: ListServicesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<PaginatedResponseDto<ServiceListItemDto>> {
    const { page, perPage, ...filters } = query;
    const pagination = { page, perPage };
    const result = await this.servicesService.listServices(
      filters,
      pageToOffsetPagination(pagination),
      user.tenantId,
    );

    return createPaginatedResponse(result, pagination, request.originalUrl);
  }

  @Get(':serviceId')
  getService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ServiceDetailDto> {
    return this.servicesService.getService(serviceId, user.tenantId);
  }
}
