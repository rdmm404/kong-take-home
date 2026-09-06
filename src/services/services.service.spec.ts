import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let servicesService: ServicesService;
  let serviceRepository: jest.Mocked<Pick<Repository<Service>, 'findOne'>>;

  beforeEach(async () => {
    serviceRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
      ],
    }).compile();

    servicesService = module.get(ServicesService);
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

      await expect(servicesService.getService(1)).resolves.toEqual({
        id: 1,
        name: 'Payments API',
        description: 'Processes card payments and refunds.',
        createdAt,
        updatedAt,
      });
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throws when the service does not exist', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(servicesService.getService(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
