import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OffsetPagination,
  PaginatedResult,
} from '../common/pagination/pagination';
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
    pagination: OffsetPagination,
    tenantId: number,
  ): Promise<PaginatedResult<VersionDto>> {
    const serviceExists = await this.serviceRepository.exists({
      where: { id: serviceId, tenantId },
    });

    if (!serviceExists) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    const [versions, total] = await this.versionRepository.findAndCount({
      where: { serviceId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });

    return {
      data: versions.map((version) => ({
        id: version.id,
        version: version.version,
        notes: version.notes,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
      })),
      total,
    };
  }
}
