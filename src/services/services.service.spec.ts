import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ListServicesQueryDto } from './dto/requests/list-services-query.dto';
import { Service } from './entities/service.entity';
import { ListServicesQuery } from './queries/list-services.query';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let servicesService: ServicesService;
  let serviceRepository: jest.Mocked<Pick<Repository<Service>, 'findOne'>>;
  let listServicesQuery: jest.Mocked<Pick<ListServicesQuery, 'execute'>>;

  beforeEach(async () => {
    serviceRepository = {
      findOne: jest.fn(),
    };
    listServicesQuery = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: ListServicesQuery,
          useValue: listServicesQuery,
        },
      ],
    }).compile();

    servicesService = module.get(ServicesService);
  });

  describe('listServices', () => {
    it('returns a page with a link to the next page', async () => {
      listServicesQuery.execute.mockResolvedValue({
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
      const query = Object.assign(new ListServicesQueryDto(), {
        perPage: 1,
        sortBy: '-versionCount' as const,
      });

      await expect(servicesService.listServices(query, 1)).resolves.toEqual({
        data: [
          {
            id: 1,
            name: 'Payments API',
            description: 'Processes card payments and refunds.',
            versionCount: 3,
          },
        ],
        total: 2,
        totalPages: 2,
        next: '/services?page=2&perPage=1&sortBy=-versionCount',
      });
      expect(listServicesQuery.execute).toHaveBeenCalledWith(query, 1);
    });

    it('rejects an inverted version count range', async () => {
      const query = Object.assign(new ListServicesQueryDto(), {
        versionCountFrom: 3,
        versionCountTo: 1,
      });

      await expect(servicesService.listServices(query, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(listServicesQuery.execute).not.toHaveBeenCalled();
    });
  });

  describe('getService', () => {
    it('returns the public service fields', async () => {
      const createdAt = new Date('2024-01-10T09:00:00.000Z');
      const updatedAt = new Date('2024-08-05T11:15:00.000Z');

      serviceRepository.findOne.mockResolvedValue({
        id: 1,
        tenantId: 1,
        name: 'Payments API',
        description: 'Processes card payments and refunds.',
        createdAt,
        updatedAt,
        versions: [],
      });

      await expect(servicesService.getService(1, 1)).resolves.toEqual({
        id: 1,
        name: 'Payments API',
        description: 'Processes card payments and refunds.',
        createdAt,
        updatedAt,
      });
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 1 },
      });
    });

    it('throws when the service does not exist', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(servicesService.getService(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
