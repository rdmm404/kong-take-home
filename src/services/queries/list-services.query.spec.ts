import 'reflect-metadata';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ListServicesQueryDto } from '../dto/requests/list-services-query.dto';
import { Service } from '../entities/service.entity';
import { ListServicesQuery } from './list-services.query';

describe('ListServicesQuery', () => {
  let listServicesQuery: ListServicesQuery;
  let serviceRepository: jest.Mocked<
    Pick<Repository<Service>, 'createQueryBuilder'>
  >;
  let serviceQuery: {
    select: jest.Mock;
    addSelect: jest.Mock;
    leftJoin: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    offset: jest.Mock;
    limit: jest.Mock;
    getCount: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(() => {
    serviceQuery = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
    };
    serviceRepository = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(
          serviceQuery as unknown as SelectQueryBuilder<Service>,
        ),
    };
    listServicesQuery = new ListServicesQuery(
      serviceRepository as unknown as Repository<Service>,
    );
  });

  it('returns and maps the requested page', async () => {
    serviceQuery.getCount.mockResolvedValue(2);
    serviceQuery.getRawMany.mockResolvedValue([
      {
        id: 1,
        name: 'Payments API',
        description: 'Processes card payments and refunds.',
        versionCount: '3',
      },
    ]);
    const query = Object.assign(new ListServicesQueryDto(), {
      page: 2,
      perPage: 1,
      sortBy: '-versionCount' as const,
    });

    await expect(listServicesQuery.execute(query, 1)).resolves.toEqual({
      data: [
        {
          id: 1,
          name: 'Payments API',
          description: 'Processes card payments and refunds.',
          versionCount: 3,
        },
      ],
      total: 2,
    });
    expect(serviceQuery.andWhere).toHaveBeenCalledWith(
      'service.tenantId = :tenantId',
      { tenantId: 1 },
    );
    expect(serviceQuery.offset).toHaveBeenCalledWith(1);
    expect(serviceQuery.limit).toHaveBeenCalledWith(1);
    expect(serviceQuery.addOrderBy).toHaveBeenCalledWith('service.id', 'DESC');
  });

  it('applies the supplied filters', async () => {
    serviceQuery.getCount.mockResolvedValue(0);
    serviceQuery.getRawMany.mockResolvedValue([]);
    const query = Object.assign(new ListServicesQueryDto(), {
      search: 'payments',
      versionCountFrom: 1,
      versionCountTo: 3,
      createdAtFrom: '2024-01-01T00:00:00.000Z',
      createdAtTo: '2024-12-31T23:59:59.999Z',
      latestVersionCreatedAtFrom: '2024-06-01T00:00:00.000Z',
      latestVersionCreatedAtTo: '2024-12-31T23:59:59.999Z',
    });

    await listServicesQuery.execute(query, 1);

    expect(serviceQuery.andWhere).toHaveBeenCalledTimes(8);
    expect(serviceQuery.andWhere).toHaveBeenCalledWith(
      '(service.name ILIKE :search OR service.description ILIKE :search)',
      { search: '%payments%' },
    );
    expect(serviceQuery.andWhere).toHaveBeenCalledWith(
      'service.createdAt >= :createdAtFrom',
      { createdAtFrom: '2024-01-01T00:00:00.000Z' },
    );
  });
});
