import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from '../common/dto/responses/paginated-response.dto';
import { ListVersionsQueryDto } from './dto/requests/list-versions-query.dto';
import { VersionDto } from './dto/responses/version.dto';
import { Service } from './entities/service.entity';
import { Version } from './entities/version.entity';

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}

  async listVersions(
    serviceId: number,
    query: ListVersionsQueryDto,
    tenantId: number,
  ): Promise<PaginatedResponseDto<VersionDto>> {
    const serviceExists = await this.serviceRepository.exists({
      where: { id: serviceId, tenantId },
    });

    if (!serviceExists) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    const [versions, total] = await this.versionRepository.findAndCount({
      where: { serviceId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });
    const totalPages = Math.ceil(total / query.perPage);

    return {
      data: versions.map((version) => ({
        id: version.id,
        version: version.version,
        notes: version.notes,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
      })),
      total,
      totalPages,
      next: this.createNextPageUrl(serviceId, query, totalPages),
    };
  }

  private createNextPageUrl(
    serviceId: number,
    query: ListVersionsQueryDto,
    totalPages: number,
  ): string | null {
    if (query.page >= totalPages) {
      return null;
    }

    const params = new URLSearchParams({
      page: String(query.page + 1),
      perPage: String(query.perPage),
    });

    return `/services/${serviceId}/versions?${params.toString()}`;
  }
}
