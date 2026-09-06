import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../common/dto/responses/paginated-response.dto';
import { ListServicesQueryDto } from './dto/requests/list-services-query.dto';
import { ServiceDetailDto } from './dto/responses/service-detail.dto';
import { ServiceListItemDto } from './dto/responses/service-list-item.dto';
import { Service } from './entities/service.entity';
import { ListServicesQuery } from './queries/list-services.query';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly listServicesQuery: ListServicesQuery,
  ) {}

  async listServices(
    query: ListServicesQueryDto,
  ): Promise<PaginatedResponseDto<ServiceListItemDto>> {
    this.validateListRanges(query);

    const { data, total } = await this.listServicesQuery.execute(query);
    const totalPages = Math.ceil(total / query.perPage);

    return {
      data,
      total,
      totalPages,
      next: this.createNextPageUrl(query, totalPages),
    };
  }

  async getService(serviceId: number): Promise<ServiceDetailDto> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
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

  private validateListRanges(query: ListServicesQueryDto): void {
    if (
      query.versionCountFrom !== undefined &&
      query.versionCountTo !== undefined &&
      query.versionCountFrom > query.versionCountTo
    ) {
      throw new BadRequestException(
        'versionCountFrom must not be greater than versionCountTo',
      );
    }

    this.validateDateRange(
      query.createdAtFrom,
      query.createdAtTo,
      'createdAtFrom must not be later than createdAtTo',
    );
    this.validateDateRange(
      query.latestVersionCreatedAtFrom,
      query.latestVersionCreatedAtTo,
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

  private createNextPageUrl(
    query: ListServicesQueryDto,
    totalPages: number,
  ): string | null {
    if (query.page >= totalPages) {
      return null;
    }

    const params = new URLSearchParams({
      page: String(query.page + 1),
      perPage: String(query.perPage),
    });
    const optionalParams = {
      sortBy: query.sortBy,
      search: query.search,
      versionCountFrom: query.versionCountFrom,
      versionCountTo: query.versionCountTo,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      latestVersionCreatedAtFrom: query.latestVersionCreatedAtFrom,
      latestVersionCreatedAtTo: query.latestVersionCreatedAtTo,
    };

    for (const [name, value] of Object.entries(optionalParams)) {
      if (value !== undefined) {
        params.set(name, String(value));
      }
    }

    return `/services?${params.toString()}`;
  }
}
