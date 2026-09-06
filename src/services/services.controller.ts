import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ServiceDetailDto } from './dto/service-detail.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get(':serviceId')
  getService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<ServiceDetailDto> {
    return this.servicesService.getService(serviceId);
  }
}
