import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { POSTGRES_ERROR_CODE } from '../common/database/postgres-error-code';
import {
  OffsetPagination,
  PaginatedResult,
} from '../common/pagination/pagination';
import { CreateServiceDto } from './dto/requests/create-service.dto';
import { UpdateServiceDto } from './dto/requests/update-service.dto';
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

  async createService(
    input: CreateServiceDto,
    tenantId: number,
  ): Promise<ServiceDetailDto> {
    const service = this.serviceRepository.create({
      tenantId,
      name: input.name,
      description: input.description ?? null,
    });

    return this.toServiceDetail(await this.serviceRepository.save(service));
  }

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

    return this.toServiceDetail(service);
  }

  async updateService(
    serviceId: number,
    input: UpdateServiceDto,
    tenantId: number,
  ): Promise<ServiceDetailDto> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    if (input.name !== undefined) {
      service.name = input.name;
    }
    if (input.description !== undefined) {
      service.description = input.description;
    }

    return this.toServiceDetail(await this.serviceRepository.save(service));
  }

  async deleteService(serviceId: number, tenantId: number): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    try {
      await this.serviceRepository.remove(service);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code ===
          POSTGRES_ERROR_CODE.FOREIGN_KEY_VIOLATION
      ) {
        throw new ConflictException(
          `Service ${serviceId} cannot be deleted while it has versions`,
        );
      }

      throw error;
    }
  }

  private toServiceDetail(service: Service): ServiceDetailDto {
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
