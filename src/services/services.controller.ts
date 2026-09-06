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
import { ListServicesQueryDto } from './dto/requests/list-services-query.dto';
import { ServiceDetailDto } from './dto/responses/service-detail.dto';
import { ServiceListItemDto } from './dto/responses/service-list-item.dto';
import { ServicesService } from './services.service';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  listServices(
    @Query() query: ListServicesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<ServiceListItemDto>> {
    return this.servicesService.listServices(query, user.tenantId);
  }

  @Get(':serviceId')
  getService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ServiceDetailDto> {
    return this.servicesService.getService(serviceId, user.tenantId);
  }
}
