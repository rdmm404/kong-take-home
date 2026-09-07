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
- Filtering is limited to (what i think) would be useful for this dashboard:
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
- Empty PATCH requests are accepted as no-ops since all update fields are optional
- Permanent DELETEs are acceptable for the current scope, soft deletes are excluded for the sake of simplicity.

## Entities

### Service
- id: integer | primary key | autoincrement
- tenantId: integer | index
- name: string
- description: string | nullable
- createdAt: timestamptz | index
- updatedAt: timestamptz

### Version
- id: integer | primary key | autoincrement
- serviceId: integer | foreign key to Service | index
- version: string | unique per service
- notes: string | nullable
- createdAt: timestamptz | index
- updatedAt: timestamptz

`tenantId` lives on Service, while Version gets its tenant through its parent. This avoids storing the same tenant relationship twice. Every lookup is scoped using the tenant in the JWT, and cross-tenant resources return 404 so we don't reveal that they exist. `tenantId` isn't included in API responses because clients don't need it.

Database constraints are the final authority for version uniqueness and service/version relationships. This keeps those rules correct under concurrent requests. Service deletion is restricted instead of cascading because silently deleting all version history would be surprising.

## API

### Demo Token
This is a demo "authentication" endpoint. It's just a helper to be used for generating signed JWTs that the app will accept. It can accept any combination of userId and tenantId to make it easier for testing. Tokens use HS256 and expire after one hour.

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
- Body:
    - id: integer
    - name: string
    - description: string | null
    - createdAt: string (iso timestamp)
    - updatedAt: string (iso timestamp)

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
- Body:
    - id: integer
    - name: string
    - description: string | null
    - createdAt: string (iso timestamp)
    - updatedAt: string (iso timestamp)

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
- Body:
    - id: integer
    - name: string
    - description: string | null
    - createdAt: string (iso timestamp)
    - updatedAt: string (iso timestamp)

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
- Body:
    - id: integer
    - version: string
    - notes: string | null
    - createdAt: string (iso timestamp)
    - updatedAt: string (iso timestamp)

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
- Body:
    - id: integer
    - version: string
    - notes: string | null
    - createdAt: string (iso timestamp)
    - updatedAt: string (iso timestamp)

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

**Query Params:**
- page: integer
- perPage: integer

Default ordering: `createdAt DESC`, then `id DESC`

**Success Response:**
- Status: 200 OK
- Body:
    - data: Version[]
        - id: integer
        - version: string
        - notes: string | null
        - createdAt: string (iso timestamp)
        - updatedAt: string (iso timestamp)
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

**Query Params:**
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

Default ordering: `createdAt DESC`, then `id DESC`. All sorting uses `id` as a final tie-breaker. `versionCount` is calculated from the Version records rather than stored on Service.

**Success Response:**
- Status: 200 OK
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

This endpoint returns the data needed for the dashboard cards, including the version count. Service details and the actual version records have separate endpoints so the list response stays small.

Version counts and latest-version dates are calculated from Version records. The query joins one grouped version aggregate instead of loading versions or running an N+1 query. This favors consistent data and simple writes. At a much larger scale, a stored counter or summary table might be worth considering.

Page-based pagination matches the UI and is simple to use. The stable ID tie-breaker makes ordering deterministic. Offset pagination and total counts can become expensive on large or deep result sets, where cursor pagination may be a better fit.

Search uses `ILIKE '%term%'` because substring matching feels right for this UI. A normal B-tree index won't help much with that pattern. If it becomes slow, a PostgreSQL trigram index would preserve the same behavior. Full-text search would make more sense if we wanted word-based matching instead.

## Application structure

The code is organized by feature. Versions stay under `services/` because clients only access them through a service.

```text
database/
├── migrations/
└── seeds/
src/
├── auth/
├── common/
├── config/
├── services/
│   ├── dto/
│   ├── entities/
│   ├── queries/
│   ├── services.module.ts
│   ├── services.controller.ts
│   ├── services.service.ts
│   ├── versions.controller.ts
│   └── versions.service.ts
├── app.module.ts
├── configure-app.ts
└── main.ts
test/
└── app.e2e-spec.ts
```

### Root module

`AppModule` wires together configuration, authentication, the database, and the services feature. `main.ts` starts the server. `configure-app.ts` applies settings shared by the running server and end-to-end tests.

### Authentication

The `auth/` folder issues demo tokens and checks JWTs on protected requests. The demo endpoint signs a token with the supplied user and tenant IDs. It is a convenient way to get a working token, not a substitute for login.

`jwt-auth.guard.ts` rejects missing or invalid tokens and attaches the verified identity to the request. `current-user.decorator.ts` reads that identity for a controller, so the controller does not need the raw HTTP request.

A real login flow would add a `users/` feature to store and look up users. Auth would call it to check credentials, then issue the token.

### Database

The top-level `database/` folder contains the TypeORM CLI data source, migrations and seeds. The runtime TypeORM config stays under `src/config/` since Nest loads it.

### Services

The `services/` folder contains the entities, DTOs, controllers, and logic for services and versions. Versions use a separate controller and service so their list, create, update, and delete operations have a clear home. They remain in `ServicesModule` because a version is always accessed through a service and doesn't have an independent lifecycle. A separate `VersionsModule` would add another module boundary without giving us much right now. If versions later gain independent endpoints or responsibilities, splitting them into their own module would make more sense.

`ServicesService` uses the service repository and `VersionsService` uses the version repository. `VersionsService` delegates parent lookups to `ServicesService` so the tenant checks aren't repeated. The service list has a separate query class since its filtering and aggregation are more complex. We won't add repository wrappers unless query logic starts repeating.

Controllers handle page numbers and build pagination links. Services just receive an offset and limit and return the data and total. Every public operation receives a tenant ID explicitly.

### Tests

Unit tests sit next to the code they cover. They cover authentication, service behavior, pagination and the service-list query.

The E2E tests start the real Nest app and call it through Supertest against PostgreSQL. They cover the main read and write flows, auth, validation, tenant isolation, pagination and the important database constraints.

## Things we'd revisit for production

- Replace the demo token endpoint with a trusted auth service or identity provider
- Add roles and permissions if tenant membership isn't enough
- Decide on audit history, archival and soft deletion requirements
- Benchmark the list query with production-shaped data before denormalizing counts or changing pagination
- Add rate limiting, observability, OpenAPI docs and deployment configuration
