import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { Service } from '../src/services/entities/service.entity';
import { Version } from '../src/services/entities/version.entity';

interface TokenResponse {
  accessToken: string;
}

interface ServiceResponse {
  id: number;
  name: string;
  description: string | null;
}

interface VersionResponse {
  id: number;
  version: string;
  notes: string | null;
}

interface ServiceListResponse {
  data: Array<ServiceResponse & { versionCount: number }>;
  total: number;
  totalPages: number;
  next: string | null;
}

interface VersionListResponse {
  data: VersionResponse[];
  total: number;
  totalPages: number;
  next: string | null;
}

describe('Service catalog API (e2e)', () => {
  const tenantId = 900001;
  const otherTenantId = 900002;

  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;
  let otherToken: string;
  let serviceId: number;

  async function removeTestData(): Promise<void> {
    const serviceRepository = dataSource.getRepository(Service);
    const services = await serviceRepository.find({
      select: { id: true },
      where: { tenantId: In([tenantId, otherTenantId]) },
    });
    const serviceIds = services.map((service) => service.id);

    if (serviceIds.length > 0) {
      await dataSource
        .getRepository(Version)
        .delete({ serviceId: In(serviceIds) });
      await serviceRepository.delete({ id: In(serviceIds) });
    }
  }

  async function getToken(forTenantId: number): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/demo-token')
      .send({ userId: 1, tenantId: forTenantId })
      .expect(201);

    return (response.body as TokenResponse).accessToken;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
    await removeTestData();

    token = await getToken(tenantId);
    otherToken = await getToken(otherTenantId);

    const firstServiceResponse = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Alpha', description: 'Searchable service' })
      .expect(201);
    serviceId = (firstServiceResponse.body as ServiceResponse).id;

    await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Beta' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/services/${serviceId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: '1.0.0' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/services/${serviceId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: '2.0.0' })
      .expect(201);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await removeTestData();
    }
    await app?.close();
  });

  it('lists, filters, sorts, and paginates services and versions', async () => {
    const servicesResponse = await request(app.getHttpServer())
      .get('/services')
      .query({ search: 'E2E', sortBy: '-versionCount', perPage: 1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const services = servicesResponse.body as ServiceListResponse;

    expect(services.data).toHaveLength(1);
    expect(services.data[0]).toMatchObject({
      id: serviceId,
      name: 'E2E Alpha',
      versionCount: 2,
    });
    expect(services.total).toBe(2);
    expect(services.totalPages).toBe(2);
    expect(services.next).toContain('page=2');
    expect(services.next).toContain('search=E2E');

    await request(app.getHttpServer())
      .get(`/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }: { body: ServiceResponse }) => {
        expect(body.name).toBe('E2E Alpha');
      });

    const versionsResponse = await request(app.getHttpServer())
      .get(`/services/${serviceId}/versions`)
      .query({ perPage: 1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const versions = versionsResponse.body as VersionListResponse;

    expect(versions.data).toHaveLength(1);
    expect(versions.data[0].version).toBe('2.0.0');
    expect(versions.total).toBe(2);
    expect(versions.totalPages).toBe(2);
    expect(versions.next).toContain('page=2');
  });

  it('enforces authentication, validation, and tenant isolation', async () => {
    await request(app.getHttpServer()).get('/services').expect(401);

    await request(app.getHttpServer())
      .get('/services')
      .query({ page: 0 })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    await request(app.getHttpServer())
      .get(`/services/${serviceId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('runs the write lifecycle and preserves database constraints', async () => {
    const createdServiceResponse = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Lifecycle' })
      .expect(201);
    const createdService = createdServiceResponse.body as ServiceResponse;

    await request(app.getHttpServer())
      .patch(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated' })
      .expect(200)
      .expect(({ body }: { body: ServiceResponse }) => {
        expect(body.description).toBe('Updated');
      });

    const createdVersionResponse = await request(app.getHttpServer())
      .post(`/services/${createdService.id}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: '1.0.0', notes: 'Initial' })
      .expect(201);
    const createdVersion = createdVersionResponse.body as VersionResponse;

    await request(app.getHttpServer())
      .post(`/services/${createdService.id}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: '1.0.0' })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/services/${createdService.id}/versions/${createdVersion.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: null })
      .expect(200)
      .expect(({ body }: { body: VersionResponse }) => {
        expect(body.notes).toBeNull();
      });

    await request(app.getHttpServer())
      .delete(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/services/${createdService.id}/versions/${createdVersion.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
