# Design

## Considerations & Assumptions
- Duplicate names in the screenshot are on purpose (not a design mistake) -> system can allow it
- High throughput will be handled on a best-effort basis; simplicity will be favored for this take-home for things like:
    - auth (carrying `tenantId` for implementation simplicity in favor of auth consistency)
    - pagination
    - filtering
- Version numbers can be arbitrary
- Authentication uses a demo JWT with `userId` and `tenantId` claims
    - A demo auth endpoint accepts both IDs and issues a valid token signed by the application, without requiring a user table or credentials
    - The demo endpoint is included in this take-home application in every environment. A production deployment would omit it and trust tokens from a dedicated auth service or external identity provider
    - The API signs and validates the JWT using a development secret provided through an environment variable
    - Proper login, credential storage, and user/tenant management are out of scope for the first iteration
    - A fuller implementation would place user persistence in a separate `UsersModule`, while `AuthModule` would remain responsible for login and token handling
    - Service endpoints always take the tenant from the validated JWT; their query parameters cannot override it
- Filtering is limited to (what i think) would be what is useful here:
    - Searching on the service name and description using case-insensitive substring matching
    - Version count per service
    - Latest version created date range
    - Creation date range
- The number next to "versions" in the screenshot represents the total number of versions
- The `0–4 of 4` pagination label conflicts with the number of visible cards; the API will return the total matching elements and total pages so the client has enough information
- Services without versions do not match a latest-version created date filter
- No roles or permissions will be enforced aside from scoping requests to the authenticated user's `tenantId`
- Pagination is one-based; `page` defaults to 1 and `perPage` defaults to 10, with a maximum of 100
- `next` is the relative URL for the next page, or `null` on the final page
- Sorting is one field at a time
- No version scheme will be enforced for versions, just a simple string that could be anything.
- Permanent DELETEs are acceptable for the current scope, soft deletes are excluded for the sake of simplicity.

## Entities

### Service
- id: integer | primary key | autoincrement
- tenantId: integer | index
- name: string
- description: string | nullable
- createdAt: timestamp | index
- updatedAt: timestamp

### Version
- id: integer | primary key | autoincrement
- serviceId: integer | foreign key to Service | index
- version: string | unique per service
- notes: string | nullable
- createdAt: timestamp | index
- updatedAt: timestamp

## API

### Demo Token
This is a demo "authentication" endpoint. It's just a helper to be used for generating signed JWTs that the app will accept. It can accept any combination of userId and tenantId to make it easier for testing.

**Path:**
POST /auth/demo-token

**Request Body:**
- userId: positive integer
- tenantId: positive integer

**Success Response:**
- Status: 201 Created
- Body:
    - accessToken: string

### Create Service

**Path:**
POST /services

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Request Body:**
- name: non-empty string, required, maximum 255 characters
- description: string | null, optional

**Success Response:**
- Status: 201 Created
- Body: Service

**Error Responses:**
- 400: invalid request body
- 401: Auth token not provided or invalid

### Update Service

**Path:**
PATCH /services/:serviceId

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Request Body:**
- name: non-empty string when provided, optional, maximum 255 characters
- description: string | null, optional; null clears the description

**Success Response:**
- Status: 200 OK
- Body: Service

**Error Responses:**
- 400: invalid request body
- 401: Auth token not provided or invalid
- 404: Service not found, or belongs to another tenant

### Delete Service

**Path:**
DELETE /services/:serviceId

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Success Response:**
- Status: 204 No Content

**Error Responses:**
- 401: Auth token not provided or invalid
- 404: Service not found, or belongs to another tenant
- 409: Service still has versions

Services must be empty before deletion. The database foreign key restricts deletion while versions still reference the service.

### Service Detail

**Path:**
GET /services/:serviceId

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Success Response:**
- Status: 200 OK
- Body: Service

**Error Responses:**
- 401: Auth token not provided or invalid
- 404: Service not found, or belongs to another tenant

### Create Service Version

**Path:**
POST /services/:serviceId/versions

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Request Body:**
- version: non-empty string, required, maximum 255 characters
- notes: string | null, optional

**Success Response:**
- Status: 201 Created
- Body: Version

**Error Responses:**
- 400: invalid request body
- 401: Auth token not provided or invalid
- 404: Service not found, or belongs to another tenant
- 409: Version already exists for the service

### Update Service Version

**Path:**
PATCH /services/:serviceId/versions/:versionId

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Request Body:**
- version: non-empty string when provided, optional, maximum 255 characters
- notes: string | null, optional; null clears the notes

**Success Response:**
- Status: 200 OK
- Body: Version

**Error Responses:**
- 400: invalid request body
- 401: Auth token not provided or invalid
- 404: Service or version not found, or belongs to another tenant
- 409: Version already exists for the service

### Delete Service Version

**Path:**
DELETE /services/:serviceId/versions/:versionId

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Success Response:**
- Status: 204 No Content

**Error Responses:**
- 401: Auth token not provided or invalid
- 404: Service or version not found, or belongs to another tenant

### Service Version List

**Path:**
GET /services/:serviceId/versions

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Success Response:**
- Status: 200 OK
- Params:
    - page: integer
    - perPage: integer
- Default ordering: `createdAt DESC`, then `id DESC`
- Body:
    - data: Version[]
    - total: integer
    - totalPages: integer
    - next: string | null

**Error Responses:**
- 400: invalid query params
- 401: Auth token not provided or invalid
- 404: Service not found, or belongs to another tenant


### Service List

**Path:**
GET /services

**Headers:**
- Authorization: bearer token, JWT (carries userId and tenantId)

**Success Response:**
- Status: 200 OK
- Params:
    - page: integer
    - perPage: integer
    - sortBy: `name` | `createdAt` | `versionCount`, optionally prefixed with `-` for descending order (for example, `-name`)
    - search: string
    - versionCountFrom: int
    - versionCountTo: int
    - createdAtFrom: string (iso timestamp)
    - createdAtTo: string (iso timestamp)
    - latestVersionCreatedAtFrom: string (iso timestamp)
    - latestVersionCreatedAtTo: string (iso timestamp)
- Default ordering: `createdAt DESC`, then `id DESC`
- All sorting uses `id` as a final tie-breaker
- `versionCount` is calculated from the Version records rather than stored on Service
- Body:
    - data: ListService[]
        - id
        - name
        - description
        - versionCount
    - total: integer
    - totalPages: integer
    - next: string | null

**Error Responses:**
- 400: invalid query params
- 401: Auth token not provided or invalid

## Application structure

We'll organize the code by feature. Versions stay under `services/` because clients only access them through a service.

```text
database/
├── data-source.ts
├── migrations/
└── seeds/
    ├── data.ts
    └── seed.ts
src/
├── main.ts
├── app.module.ts
├── configure-app.ts
├── auth/
│   ├── dto/
│   │   ├── requests/
│   │   │   └── create-demo-token.dto.ts
│   │   └── responses/
│   │       └── demo-token.dto.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── authenticated-user.interface.ts
│   ├── current-user.decorator.ts
│   └── jwt-auth.guard.ts
├── common/
│   ├── database/
│   │   └── postgres-error-code.ts
│   └── pagination/
│       ├── paginated-response.dto.ts
│       └── pagination.ts
├── config/
│   └── typeorm.config.ts
└── services/
    ├── dto/
    │   ├── requests/
    │   │   ├── create-service.dto.ts
    │   │   ├── create-version.dto.ts
    │   │   ├── list-services-query.dto.ts
    │   │   ├── list-versions-query.dto.ts
    │   │   ├── update-service.dto.ts
    │   │   └── update-version.dto.ts
    │   └── responses/
    │       ├── service-detail.dto.ts
    │       ├── service-list-item.dto.ts
    │       └── version.dto.ts
    ├── entities/
    │   ├── service.entity.ts
    │   └── version.entity.ts
    ├── queries/
    │   └── list-services.query.ts
    ├── services.controller.ts
    ├── services.module.ts
    ├── services.service.ts
    ├── versions.controller.ts
    └── versions.service.ts
test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

### Root module

`AppModule` wires together configuration, authentication, the database, and the services feature. `main.ts` starts the server. `configure-app.ts` applies settings shared by the running server and end-to-end tests.

### Authentication

The `auth/` folder issues demo tokens and checks JWTs on protected requests. The demo endpoint signs a token with the supplied user and tenant IDs. It is a convenient way to get a working token, not a substitute for login.

`jwt-auth.guard.ts` rejects missing or invalid tokens and attaches the verified identity to the request. `current-user.decorator.ts` reads that identity for a controller, so the controller does not need the raw HTTP request.

A real login flow would add a `users/` feature to store and look up users. Auth would call it to check credentials, then issue the token.

### Database

The top-level `database/` folder contains the migration CLI entry point and generated migrations. `data-source.ts` exports the `DataSource` required by the CLI, which does not start Nest or use its dependency injection. The runtime options factory stays under `src/config/` because it is part of the Nest application.

### Services

The `services/` folder contains the entities, DTOs, controllers, and logic for services and versions. Versions use a separate controller and service so their list, create, update, and delete operations have a clear home. They remain in `ServicesModule` because clients only access versions through a service.

`ServicesService` uses the service repository, and `VersionsService` uses the version repository. `VersionsService` delegates tenant-scoped parent service lookups to `ServicesService` so that access rules are not repeated. We won't add repository wrappers unless query logic starts repeating. The controllers translate API pages into offsets and limits, then build pagination metadata and links with shared helpers. The services only receive the database pagination values. The service list query calculates version counts and latest-version dates in the database instead of loading versions one service at a time. Every public operation receives a tenant ID explicitly.

### Tests

Unit tests sit next to the code they cover. A focused end-to-end suite under `test/` starts the real Nest application in-process and exercises it through Supertest against PostgreSQL. It covers the main read and write flows, authentication, validation, tenant isolation, pagination, and key database constraints without repeating every unit-level edge case.
