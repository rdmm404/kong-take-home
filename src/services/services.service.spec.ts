import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError, Repository } from 'typeorm';
import { POSTGRES_ERROR_CODE } from '../common/database/postgres-error-code';
import { Service } from './entities/service.entity';
import { ListServicesQuery } from './queries/list-services.query';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let servicesService: ServicesService;
  let serviceRepository: jest.Mocked<
    Pick<Repository<Service>, 'create' | 'findOne' | 'remove' | 'save'>
  >;
  let listServicesQuery: jest.Mocked<Pick<ListServicesQuery, 'execute'>>;

  beforeEach(async () => {
    serviceRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
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

  describe('createService', () => {
    it('creates a service in the authenticated tenant', async () => {
      const createdAt = new Date('2024-01-10T09:00:00.000Z');
      const service = {
        id: 1,
        tenantId: 2,
        name: 'Payments API',
        description: null,
        createdAt,
        updatedAt: createdAt,
        versions: [],
      };
      serviceRepository.create.mockReturnValue(service);
      serviceRepository.save.mockResolvedValue(service);

      await expect(
        servicesService.createService({ name: 'Payments API' }, 2),
      ).resolves.toEqual({
        id: 1,
        name: 'Payments API',
        description: null,
        createdAt,
        updatedAt: createdAt,
      });
      expect(serviceRepository.create).toHaveBeenCalledWith({
        tenantId: 2,
        name: 'Payments API',
        description: null,
      });
      expect(serviceRepository.save).toHaveBeenCalledWith(service);
    });
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
      const filters = { sortBy: '-versionCount' as const };
      const pagination = { offset: 0, limit: 1 };

      await expect(
        servicesService.listServices(filters, pagination, 1),
      ).resolves.toEqual({
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
      expect(listServicesQuery.execute).toHaveBeenCalledWith(
        filters,
        pagination,
        1,
      );
    });

    it('rejects an inverted version count range', async () => {
      const filters = {
        versionCountFrom: 3,
        versionCountTo: 1,
      };

      await expect(
        servicesService.listServices(filters, { offset: 0, limit: 10 }, 1),
      ).rejects.toThrow(BadRequestException);
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

  describe('updateService', () => {
    it('updates a service in the authenticated tenant', async () => {
      const createdAt = new Date('2024-01-10T09:00:00.000Z');
      const updatedAt = new Date('2024-08-05T11:15:00.000Z');
      const service = {
        id: 1,
        tenantId: 1,
        name: 'Payments API',
        description: 'Old description',
        createdAt,
        updatedAt,
        versions: [],
      };
      serviceRepository.findOne.mockResolvedValue(service);
      serviceRepository.save.mockResolvedValue(service);

      await expect(
        servicesService.updateService(
          1,
          { name: 'Payment Service', description: null },
          1,
        ),
      ).resolves.toEqual({
        id: 1,
        name: 'Payment Service',
        description: null,
        createdAt,
        updatedAt,
      });
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 1 },
      });
      expect(serviceRepository.save).toHaveBeenCalledWith(service);
    });

    it('throws when the service is missing or belongs to another tenant', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(
        servicesService.updateService(1, { name: 'Payment Service' }, 2),
      ).rejects.toThrow(NotFoundException);
      expect(serviceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteService', () => {
    it('deletes an empty service in the authenticated tenant', async () => {
      const service = {
        id: 1,
        tenantId: 2,
        name: 'Payments API',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };
      serviceRepository.findOne.mockResolvedValue(service);
      serviceRepository.remove.mockResolvedValue(service);

      await expect(
        servicesService.deleteService(1, 2),
      ).resolves.toBeUndefined();
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 2 },
      });
      expect(serviceRepository.remove).toHaveBeenCalledWith(service);
    });

    it('throws when the service is missing or belongs to another tenant', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(servicesService.deleteService(1, 2)).rejects.toThrow(
        NotFoundException,
      );
      expect(serviceRepository.remove).not.toHaveBeenCalled();
    });

    it('returns a conflict when the service still has versions', async () => {
      const service = {
        id: 1,
        tenantId: 2,
        name: 'Payments API',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };
      const driverError = Object.assign(new Error(), {
        code: POSTGRES_ERROR_CODE.FOREIGN_KEY_VIOLATION,
      });
      const error = new QueryFailedError('', [], driverError);
      serviceRepository.findOne.mockResolvedValue(service);
      serviceRepository.remove.mockRejectedValue(error);

      await expect(servicesService.deleteService(1, 2)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
