import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ListServicesQueryDto,
  ServiceSort,
} from '../dto/requests/list-services-query.dto';
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
  // technically this should receive a separate entity for the arguments, however since this is a small feature, the repository is only used for HTTP
  // and the arguments map 1-to-1 to the query params, I decided to just use the DTO for the query params to avoid unnecessary mapping and boilerplate
  async execute(
    query: ListServicesQueryDto,
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

    this.applyFilters(serviceQuery, query);

    const total = await serviceQuery.getCount();

    this.applySort(serviceQuery, query.sortBy);
    serviceQuery.offset((query.page - 1) * query.perPage).limit(query.perPage);

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
    query: ListServicesQueryDto,
  ): void {
    if (query.search !== undefined) {
      serviceQuery.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.versionCountFrom !== undefined) {
      serviceQuery.andWhere(
        `${VERSION_COUNT_EXPRESSION} >= :versionCountFrom`,
        {
          versionCountFrom: query.versionCountFrom,
        },
      );
    }

    if (query.versionCountTo !== undefined) {
      serviceQuery.andWhere(`${VERSION_COUNT_EXPRESSION} <= :versionCountTo`, {
        versionCountTo: query.versionCountTo,
      });
    }

    if (query.createdAtFrom !== undefined) {
      serviceQuery.andWhere('service.createdAt >= :createdAtFrom', {
        createdAtFrom: query.createdAtFrom,
      });
    }

    if (query.createdAtTo !== undefined) {
      serviceQuery.andWhere('service.createdAt <= :createdAtTo', {
        createdAtTo: query.createdAtTo,
      });
    }

    if (query.latestVersionCreatedAtFrom !== undefined) {
      serviceQuery.andWhere(
        `${LATEST_VERSION_CREATED_AT_EXPRESSION} >= :latestVersionCreatedAtFrom`,
        { latestVersionCreatedAtFrom: query.latestVersionCreatedAtFrom },
      );
    }

    if (query.latestVersionCreatedAtTo !== undefined) {
      serviceQuery.andWhere(
        `${LATEST_VERSION_CREATED_AT_EXPRESSION} <= :latestVersionCreatedAtTo`,
        { latestVersionCreatedAtTo: query.latestVersionCreatedAtTo },
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
