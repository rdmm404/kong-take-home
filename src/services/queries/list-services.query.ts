import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OffsetPagination } from '../../common/pagination/pagination';
import { ServiceSort } from '../dto/requests/list-services-query.dto';
import { ServiceListItemDto } from '../dto/responses/service-list-item.dto';
import { Service } from '../entities/service.entity';
import { Version } from '../entities/version.entity';

const VERSION_COUNT_EXPRESSION = 'COALESCE("versionStats"."version_count", 0)';
const LATEST_VERSION_CREATED_AT_EXPRESSION =
  '"versionStats"."latest_version_created_at"';

interface ServiceListRow {
  id: number;
  name: string;
  description: string | null;
  versionCount: number | string;
}

export interface ListServicesFilters {
  sortBy?: ServiceSort;
  search?: string;
  versionCountFrom?: number;
  versionCountTo?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  latestVersionCreatedAtFrom?: string;
  latestVersionCreatedAtTo?: string;
}

export interface ListServicesQueryResult {
  data: ServiceListItemDto[];
  total: number;
}

@Injectable()
/**
 * We only need to use a query builder because I decided that versionCount and latestVersionCreatedAt would be good filters, so we need to do a LEFT JOIN on versions
 */
export class ListServicesQuery {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}
  async execute(
    filters: ListServicesFilters,
    pagination: OffsetPagination,
    tenantId: number,
  ): Promise<ListServicesQueryResult> {
    const serviceQuery = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoin(
        (versionStatsQuery) =>
          versionStatsQuery
            .select('version.serviceId', 'service_id')
            .addSelect('COUNT(*)::int', 'version_count')
            .addSelect('MAX(version.createdAt)', 'latest_version_created_at')
            .from(Version, 'version')
            .groupBy('version.serviceId'),
        'versionStats',
        '"versionStats"."service_id" = service.id',
      )
      .select('service.id', 'id')
      .addSelect('service.name', 'name')
      .addSelect('service.description', 'description')
      .addSelect(VERSION_COUNT_EXPRESSION, 'versionCount')
      .andWhere('service.tenantId = :tenantId', { tenantId });

    this.applyFilters(serviceQuery, filters);

    const total = await serviceQuery.getCount();

    this.applySort(serviceQuery, filters.sortBy);
    serviceQuery.offset(pagination.offset).limit(pagination.limit);

    const rows = await serviceQuery.getRawMany<ServiceListRow>();

    return {
      data: rows.map(
        (row): ServiceListItemDto => ({
          id: row.id,
          name: row.name,
          description: row.description,
          versionCount: Number(row.versionCount),
        }),
      ),
      total,
    };
  }

  private applyFilters(
    serviceQuery: SelectQueryBuilder<Service>,
    filters: ListServicesFilters,
  ): void {
    if (filters.search !== undefined) {
      serviceQuery.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.versionCountFrom !== undefined) {
      serviceQuery.andWhere(
        `${VERSION_COUNT_EXPRESSION} >= :versionCountFrom`,
        {
          versionCountFrom: filters.versionCountFrom,
        },
      );
    }

    if (filters.versionCountTo !== undefined) {
      serviceQuery.andWhere(`${VERSION_COUNT_EXPRESSION} <= :versionCountTo`, {
        versionCountTo: filters.versionCountTo,
      });
    }

    if (filters.createdAtFrom !== undefined) {
      serviceQuery.andWhere('service.createdAt >= :createdAtFrom', {
        createdAtFrom: filters.createdAtFrom,
      });
    }

    if (filters.createdAtTo !== undefined) {
      serviceQuery.andWhere('service.createdAt <= :createdAtTo', {
        createdAtTo: filters.createdAtTo,
      });
    }

    if (filters.latestVersionCreatedAtFrom !== undefined) {
      serviceQuery.andWhere(
        `${LATEST_VERSION_CREATED_AT_EXPRESSION} >= :latestVersionCreatedAtFrom`,
        { latestVersionCreatedAtFrom: filters.latestVersionCreatedAtFrom },
      );
    }

    if (filters.latestVersionCreatedAtTo !== undefined) {
      serviceQuery.andWhere(
        `${LATEST_VERSION_CREATED_AT_EXPRESSION} <= :latestVersionCreatedAtTo`,
        { latestVersionCreatedAtTo: filters.latestVersionCreatedAtTo },
      );
    }
  }

  private applySort(
    serviceQuery: SelectQueryBuilder<Service>,
    sortBy: ServiceSort | undefined,
  ): void {
    if (!sortBy) {
      serviceQuery
        .orderBy('service.createdAt', 'DESC')
        .addOrderBy('service.id', 'DESC');
      return;
    }

    const direction = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    const field = sortBy.replace(/^-/, '');

    switch (field) {
      case 'name':
        serviceQuery.orderBy('service.name', direction);
        break;
      case 'createdAt':
        serviceQuery.orderBy('service.createdAt', direction);
        break;
      case 'versionCount':
        serviceQuery.orderBy(VERSION_COUNT_EXPRESSION, direction);
        break;
    }

    serviceQuery.addOrderBy('service.id', direction);
  }
}
