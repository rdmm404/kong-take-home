export interface SeedVersion {
  version: string;
  notes: string | null;
  createdAt: string;
}

export interface SeedService {
  tenantId: number;
  name: string;
  description: string | null;
  createdAt: string;
  versions: SeedVersion[];
}

export const DEMO_TENANT_IDS = [1, 2];

export const SEED_SERVICES: SeedService[] = [
  {
    tenantId: 1,
    name: 'Payments API',
    description: 'Processes card payments and refunds.',
    createdAt: '2024-01-10T09:00:00.000Z',
    versions: [
      {
        version: '1.0.0',
        notes: 'Initial release.',
        createdAt: '2024-01-10T09:00:00.000Z',
      },
      {
        version: '1.1.0',
        notes: 'Added refund support.',
        createdAt: '2024-03-18T14:30:00.000Z',
      },
      {
        version: '2.0.0',
        notes: 'Added support for multiple payment providers.',
        createdAt: '2024-08-05T11:15:00.000Z',
      },
    ],
  },
  {
    tenantId: 1,
    name: 'Customer Profiles',
    description: 'Stores customer contact details and preferences.',
    createdAt: '2024-02-02T10:00:00.000Z',
    versions: [
      {
        version: '2024.02',
        notes: null,
        createdAt: '2024-02-02T10:00:00.000Z',
      },
      {
        version: '2024.09',
        notes: 'Added communication preferences.',
        createdAt: '2024-09-12T16:45:00.000Z',
      },
    ],
  },
  {
    tenantId: 1,
    name: 'Notification Service',
    description: 'Sends email and SMS notifications.',
    createdAt: '2024-04-21T08:20:00.000Z',
    versions: [
      {
        version: 'v1',
        notes: 'Email and SMS delivery.',
        createdAt: '2024-04-21T08:20:00.000Z',
      },
    ],
  },
  {
    tenantId: 1,
    name: 'Orders API',
    description: 'Creates orders and tracks their status.',
    createdAt: '2023-11-15T13:00:00.000Z',
    versions: [
      {
        version: '1.0.0',
        notes: null,
        createdAt: '2023-11-15T13:00:00.000Z',
      },
      {
        version: '1.1.0',
        notes: 'Added order status history.',
        createdAt: '2024-01-30T12:10:00.000Z',
      },
      {
        version: '1.2.0',
        notes: 'Added order cancellation.',
        createdAt: '2024-05-09T15:25:00.000Z',
      },
    ],
  },
  {
    tenantId: 1,
    name: 'Legacy Reports',
    description: null,
    createdAt: '2023-06-01T09:30:00.000Z',
    versions: [],
  },
  {
    tenantId: 2,
    name: 'Payments API',
    description: 'Handles invoice payments for tenant two.',
    createdAt: '2024-05-14T10:05:00.000Z',
    versions: [
      {
        version: '1.0',
        notes: 'Initial release.',
        createdAt: '2024-05-14T10:05:00.000Z',
      },
    ],
  },
  {
    tenantId: 2,
    name: 'Inventory API',
    description: 'Tracks stock across warehouses.',
    createdAt: '2024-03-07T07:40:00.000Z',
    versions: [
      {
        version: '1.0.0',
        notes: null,
        createdAt: '2024-03-07T07:40:00.000Z',
      },
      {
        version: '1.1.0',
        notes: 'Added warehouse transfers.',
        createdAt: '2024-07-22T17:00:00.000Z',
      },
    ],
  },
  {
    tenantId: 2,
    name: 'Orders API',
    description: 'Accepts and manages wholesale orders.',
    createdAt: '2024-01-25T11:30:00.000Z',
    versions: [
      {
        version: 'alpha',
        notes: 'Internal preview.',
        createdAt: '2024-01-25T11:30:00.000Z',
      },
      {
        version: '1.0.0',
        notes: 'First supported release.',
        createdAt: '2024-06-11T09:50:00.000Z',
      },
    ],
  },
  {
    tenantId: 2,
    name: 'Shipping Service',
    description: 'Books shipments and provides tracking updates.',
    createdAt: '2023-12-12T14:15:00.000Z',
    versions: [
      {
        version: '1',
        notes: null,
        createdAt: '2023-12-12T14:15:00.000Z',
      },
      {
        version: '2',
        notes: 'Added international shipping.',
        createdAt: '2024-04-03T10:35:00.000Z',
      },
      {
        version: '2.1',
        notes: 'Added delivery estimates.',
        createdAt: '2024-10-17T08:45:00.000Z',
      },
    ],
  },
  {
    tenantId: 2,
    name: 'Internal Tools',
    description: 'Placeholder for internal operations tooling.',
    createdAt: '2024-08-19T12:00:00.000Z',
    versions: [],
  },
];
