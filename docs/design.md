# Design

## Considerations & Assumptions
- Duplicate names in the screenshot are on purpose (not a design mistake) -> system can allow it
- High throughput will be handled on a best-effort basis; simplicity will be favored for this take-home for things like:
    - auth (carrying `tenantId` for implementation simplicity in favor of auth consistency)
    - pagination
    - filtering
- Version numbers can be arbitrary
- Authentication uses a pre-generated demo JWT with fixed `userId` and `tenantId` claims
    - The API validates the JWT using a development secret provided through an environment variable
    - Login, token issuance, and user/tenant management are out of scope for the first iteration
    - If time permits, a `User` model and proper `/login` endpoint will be added
    - The tenant is always taken from the validated JWT and cannot be overridden by the client
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
