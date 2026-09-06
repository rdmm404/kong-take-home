import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError, Repository } from 'typeorm';
import { POSTGRES_ERROR_CODE } from '../common/database/postgres-error-code';
import { Service } from './entities/service.entity';
import { Version } from './entities/version.entity';
import { ServicesService } from './services.service';
import { VersionsService } from './versions.service';

describe('VersionsService', () => {
  let versionsService: VersionsService;
  let servicesService: jest.Mocked<Pick<ServicesService, 'getService'>>;
  let versionRepository: jest.Mocked<
    Pick<
      Repository<Version>,
      'create' | 'findAndCount' | 'findOne' | 'remove' | 'save'
    >
  >;

  beforeEach(async () => {
    servicesService = {
      getService: jest.fn(),
    };
    versionRepository = {
      create: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionsService,
        {
          provide: ServicesService,
          useValue: servicesService,
        },
        {
          provide: getRepositoryToken(Version),
          useValue: versionRepository,
        },
      ],
    }).compile();

    versionsService = module.get(VersionsService);
  });

  describe('createVersion', () => {
    it('creates a version under a service in the authenticated tenant', async () => {
      const createdAt = new Date('2024-08-05T11:15:00.000Z');
      const version = {
        id: 3,
        serviceId: 1,
        version: '2.0.0',
        notes: null,
        createdAt,
        updatedAt: createdAt,
        service: {} as Service,
      };
      versionRepository.create.mockReturnValue(version);
      versionRepository.save.mockResolvedValue(version);

      await expect(
        versionsService.createVersion(1, { version: '2.0.0' }, 2),
      ).resolves.toEqual({
        id: 3,
        version: '2.0.0',
        notes: null,
        createdAt,
        updatedAt: createdAt,
      });
      expect(servicesService.getService).toHaveBeenCalledWith(1, 2);
      expect(versionRepository.create).toHaveBeenCalledWith({
        serviceId: 1,
        version: '2.0.0',
        notes: null,
      });
    });

    it('returns a conflict when the version already exists for the service', async () => {
      const version = {
        id: 3,
        serviceId: 1,
        version: '2.0.0',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {} as Service,
      };
      const driverError = Object.assign(new Error(), {
        code: POSTGRES_ERROR_CODE.UNIQUE_VIOLATION,
      });
      const error = new QueryFailedError('', [], driverError);
      versionRepository.create.mockReturnValue(version);
      versionRepository.save.mockRejectedValue(error);

      await expect(
        versionsService.createVersion(1, { version: '2.0.0' }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listVersions', () => {
    it('returns versions in a paginated response', async () => {
      const createdAt = new Date('2024-08-05T11:15:00.000Z');
      const updatedAt = new Date('2024-08-05T11:15:00.000Z');
      versionRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 3,
            serviceId: 1,
            version: '2.0.0',
            notes: 'Added support for multiple payment providers.',
            createdAt,
            updatedAt,
            service: {} as Service,
          },
        ],
        2,
      ]);
      const pagination = { offset: 0, limit: 1 };

      await expect(
        versionsService.listVersions(1, pagination, 1),
      ).resolves.toEqual({
        data: [
          {
            id: 3,
            version: '2.0.0',
            notes: 'Added support for multiple payment providers.',
            createdAt,
            updatedAt,
          },
        ],
        total: 2,
      });
      expect(versionRepository.findAndCount).toHaveBeenCalledWith({
        where: { serviceId: 1 },
        order: { createdAt: 'DESC', id: 'DESC' },
        skip: 0,
        take: 1,
      });
    });

    it('throws when the service is missing or belongs to another tenant', async () => {
      servicesService.getService.mockRejectedValue(new NotFoundException());

      await expect(
        versionsService.listVersions(1, { offset: 0, limit: 10 }, 2),
      ).rejects.toThrow(NotFoundException);
      expect(versionRepository.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('updateVersion', () => {
    it('updates a version under a service in the authenticated tenant', async () => {
      const createdAt = new Date('2024-08-05T11:15:00.000Z');
      const version = {
        id: 3,
        serviceId: 1,
        version: '1.0.0',
        notes: 'Old notes',
        createdAt,
        updatedAt: createdAt,
        service: {} as Service,
      };
      versionRepository.findOne.mockResolvedValue(version);
      versionRepository.save.mockResolvedValue(version);

      await expect(
        versionsService.updateVersion(
          1,
          3,
          { version: '2.0.0', notes: null },
          2,
        ),
      ).resolves.toEqual({
        id: 3,
        version: '2.0.0',
        notes: null,
        createdAt,
        updatedAt: createdAt,
      });
      expect(servicesService.getService).toHaveBeenCalledWith(1, 2);
      expect(versionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 3, serviceId: 1 },
      });
      expect(versionRepository.save).toHaveBeenCalledWith(version);
    });

    it('throws when the version does not belong to the service', async () => {
      versionRepository.findOne.mockResolvedValue(null);

      await expect(
        versionsService.updateVersion(1, 3, { version: '2.0.0' }, 1),
      ).rejects.toThrow(NotFoundException);
      expect(versionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteVersion', () => {
    it('deletes a version under a service in the authenticated tenant', async () => {
      const version = {
        id: 3,
        serviceId: 1,
        version: '2.0.0',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: {} as Service,
      };
      versionRepository.findOne.mockResolvedValue(version);
      versionRepository.remove.mockResolvedValue(version);

      await expect(
        versionsService.deleteVersion(1, 3, 2),
      ).resolves.toBeUndefined();
      expect(servicesService.getService).toHaveBeenCalledWith(1, 2);
      expect(versionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 3, serviceId: 1 },
      });
      expect(versionRepository.remove).toHaveBeenCalledWith(version);
    });
  });
});
