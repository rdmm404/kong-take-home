# Service Catalog

This app implements the requirements to support a Service Catalog, as outlined in [exercise.md](./docs/exercise.md). All the base requirements have been met, following the requested tech stack (and versions). The extra requirements have been met as outlined:
- **Complete CRUD:** Implemented for both Services and Versions, with hard deletes and request validation
- **Testing:** Unit tests for authentication, services, queries, and pagination, along with E2E tests for the whole application
- **Authentication:** Endpoints require and validate a JWT provided as a bearer token. To avoid implementing a full-blown user authentication module, a "demo" authentication endpoint was added. This endpoint generates a signed JWT with the `userId` and `tenantId` provided.

For information about assumptions and decisions made, full API contracts, and the application architecture, see [design.md](./docs/design.md).

## Requirements
- [pnpm](https://pnpm.io/)
- [Docker and Docker Compose](https://www.docker.com/products/docker-desktop/)
- [Node.js 20](https://nodejs.org/en/download)

## Dev commands
Install dependencies (package manager used was pnpm):
```bash
pnpm install
```

Copy the example env file into `.env`. Optional: update `APP_PORT` or `JWT_SECRET` with different values.
```bash
cp .env.example .env
```

Initialize the database. This starts the PostgreSQL container, runs the migrations, and seeds demo services and versions for tenants 1 and 2.
```bash
pnpm db:init
```

Run the dev server:
```bash
pnpm start:dev
```

The API is available at `http://localhost:3000`.

### Try the API

Generate a demo token:
```bash
curl -X POST http://localhost:3000/auth/demo-token \
  -H 'Content-Type: application/json' \
  -d '{"userId": 1, "tenantId": 1}'
```

Use the returned `accessToken` to list services:
```bash
curl 'http://localhost:3000/services?search=api&sortBy=-versionCount' \
  -H 'Authorization: Bearer <accessToken>'
```

Run the tests:
```bash
pnpm test # unit
pnpm test:e2e # end-to-end, requires DB setup above
```

Stop the database when finished:
```bash
pnpm db:stop
```