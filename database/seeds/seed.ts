import { In } from 'typeorm';
import dataSource from '../data-source';
import { Service } from '../../src/services/entities/service.entity';
import { Version } from '../../src/services/entities/version.entity';
import { DEMO_TENANT_IDS, SEED_SERVICES } from './data';

async function seed(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const serviceRepository = manager.getRepository(Service);
      const versionRepository = manager.getRepository(Version);
      const existingServices = await serviceRepository.find({
        select: { id: true },
        where: { tenantId: In(DEMO_TENANT_IDS) },
      });

      if (existingServices.length > 0) {
        await versionRepository.delete({
          serviceId: In(existingServices.map(({ id }) => id)),
        });
      }

      await serviceRepository.delete({ tenantId: In(DEMO_TENANT_IDS) });

      for (const seedService of SEED_SERVICES) {
        const { versions, createdAt, ...serviceData } = seedService;
        const serviceDate = new Date(createdAt);
        const service = await serviceRepository.save(
          serviceRepository.create({
            ...serviceData,
            createdAt: serviceDate,
            updatedAt: serviceDate,
          }),
        );

        if (versions.length === 0) {
          continue;
        }

        await versionRepository.save(
          versions.map((seedVersion) => {
            const versionDate = new Date(seedVersion.createdAt);

            return versionRepository.create({
              serviceId: service.id,
              version: seedVersion.version,
              notes: seedVersion.notes,
              createdAt: versionDate,
              updatedAt: versionDate,
            });
          }),
        );
      }
    });

    console.log(
      `Seeded ${
        SEED_SERVICES.length
      } services for tenants ${DEMO_TENANT_IDS.join(', ')}.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Failed to seed the database.', error);
  process.exitCode = 1;
});
