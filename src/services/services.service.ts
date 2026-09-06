import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OffsetPagination,
  PaginatedResult,
} from '../common/pagination/pagination';
import { ServiceDetailDto } from './dto/responses/service-detail.dto';
import { ServiceListItemDto } from './dto/responses/service-list-item.dto';
import { Service } from './entities/service.entity';
import {
  ListServicesFilters,
  ListServicesQuery,
} from './queries/list-services.query';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly listServicesQuery: ListServicesQuery,
  ) {}

  async listServices(
    filters: ListServicesFilters,
    pagination: OffsetPagination,
    tenantId: number,
  ): Promise<PaginatedResult<ServiceListItemDto>> {
    this.validateListRanges(filters);

    return this.listServicesQuery.execute(filters, pagination, tenantId);
  }

  async getService(
    serviceId: number,
    tenantId: number,
  ): Promise<ServiceDetailDto> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  private validateListRanges(filters: ListServicesFilters): void {
    if (
      filters.versionCountFrom !== undefined &&
      filters.versionCountTo !== undefined &&
      filters.versionCountFrom > filters.versionCountTo
    ) {
      throw new BadRequestException(
        'versionCountFrom must not be greater than versionCountTo',
      );
    }

    this.validateDateRange(
      filters.createdAtFrom,
      filters.createdAtTo,
      'createdAtFrom must not be later than createdAtTo',
    );
    this.validateDateRange(
      filters.latestVersionCreatedAtFrom,
      filters.latestVersionCreatedAtTo,
      'latestVersionCreatedAtFrom must not be later than latestVersionCreatedAtTo',
    );
  }

  private validateDateRange(
    from: string | undefined,
    to: string | undefined,
    message: string,
  ): void {
    if (
      from !== undefined &&
      to !== undefined &&
      Date.parse(from) > Date.parse(to)
    ) {
      throw new BadRequestException(message);
    }
  }
}
