import {
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
import { CreateVersionDto } from './dto/requests/create-version.dto';
import { UpdateVersionDto } from './dto/requests/update-version.dto';
import { VersionDto } from './dto/responses/version.dto';
import { Version } from './entities/version.entity';
import { ServicesService } from './services.service';

@Injectable()
export class VersionsService {
  constructor(
    private readonly servicesService: ServicesService,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}

  async createVersion(
    serviceId: number,
    input: CreateVersionDto,
    tenantId: number,
  ): Promise<VersionDto> {
    await this.servicesService.getService(serviceId, tenantId);

    const version = this.versionRepository.create({
      serviceId,
      version: input.version,
      notes: input.notes ?? null,
    });

    return this.toVersionDto(await this.saveVersion(version));
  }

  async listVersions(
    serviceId: number,
    pagination: OffsetPagination,
    tenantId: number,
  ): Promise<PaginatedResult<VersionDto>> {
    await this.servicesService.getService(serviceId, tenantId);

    const [versions, total] = await this.versionRepository.findAndCount({
      where: { serviceId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });

    return {
      data: versions.map((version) => this.toVersionDto(version)),
      total,
    };
  }

  async updateVersion(
    serviceId: number,
    versionId: number,
    input: UpdateVersionDto,
    tenantId: number,
  ): Promise<VersionDto> {
    await this.servicesService.getService(serviceId, tenantId);
    const version = await this.findVersion(serviceId, versionId);

    if (input.version !== undefined) {
      version.version = input.version;
    }
    if (input.notes !== undefined) {
      version.notes = input.notes;
    }

    return this.toVersionDto(await this.saveVersion(version));
  }

  async deleteVersion(
    serviceId: number,
    versionId: number,
    tenantId: number,
  ): Promise<void> {
    await this.servicesService.getService(serviceId, tenantId);
    const version = await this.findVersion(serviceId, versionId);

    await this.versionRepository.remove(version);
  }

  private async findVersion(
    serviceId: number,
    versionId: number,
  ): Promise<Version> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId, serviceId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return version;
  }

  private async saveVersion(version: Version): Promise<Version> {
    try {
      return await this.versionRepository.save(version);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code ===
          POSTGRES_ERROR_CODE.UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Version ${version.version} already exists for this service`,
        );
      }

      throw error;
    }
  }

  private toVersionDto(version: Version): VersionDto {
    return {
      id: version.id,
      version: version.version,
      notes: version.notes,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }
}
