import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/responses/paginated-response.dto';
import { ListServicesQueryDto } from './dto/requests/list-services-query.dto';
import { ServiceDetailDto } from './dto/responses/service-detail.dto';
import { ServiceListItemDto } from './dto/responses/service-list-item.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  listServices(
    @Query() query: ListServicesQueryDto,
  ): Promise<PaginatedResponseDto<ServiceListItemDto>> {
    return this.servicesService.listServices(query);
  }

  @Get(':serviceId')
  getService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<ServiceDetailDto> {
    return this.servicesService.getService(serviceId);
  }
}
