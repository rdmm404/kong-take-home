import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ListVersionsQueryDto } from './dto/requests/list-versions-query.dto';
import { Service } from './entities/service.entity';
import { Version } from './entities/version.entity';
import { VersionsService } from './versions.service';

describe('VersionsService', () => {
  let versionsService: VersionsService;
  let serviceRepository: jest.Mocked<Pick<Repository<Service>, 'exists'>>;
  let versionRepository: jest.Mocked<Pick<Repository<Version>, 'findAndCount'>>;

  beforeEach(async () => {
    serviceRepository = {
      exists: jest.fn(),
    };
    versionRepository = {
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionsService,
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
        {
          provide: getRepositoryToken(Version),
          useValue: versionRepository,
        },
      ],
    }).compile();

    versionsService = module.get(VersionsService);
  });

  it('returns versions in a paginated response', async () => {
    const createdAt = new Date('2024-08-05T11:15:00.000Z');
    const updatedAt = new Date('2024-08-05T11:15:00.000Z');
    serviceRepository.exists.mockResolvedValue(true);
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
    const query = Object.assign(new ListVersionsQueryDto(), { perPage: 1 });

    await expect(versionsService.listVersions(1, query, 1)).resolves.toEqual({
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
      totalPages: 2,
      next: '/services/1/versions?page=2&perPage=1',
    });
    expect(serviceRepository.exists).toHaveBeenCalledWith({
      where: { id: 1, tenantId: 1 },
    });
    expect(versionRepository.findAndCount).toHaveBeenCalledWith({
      where: { serviceId: 1 },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: 0,
      take: 1,
    });
  });

  it('throws when the service is missing or belongs to another tenant', async () => {
    serviceRepository.exists.mockResolvedValue(false);

    await expect(
      versionsService.listVersions(1, new ListVersionsQueryDto(), 2),
    ).rejects.toThrow(NotFoundException);
    expect(versionRepository.findAndCount).not.toHaveBeenCalled();
  });
});
