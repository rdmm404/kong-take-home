# Design

## Considerations & Assumptions
- Duplicate names in the screenshot are on purpose (not a design mistake) -> system can allow it
- High throughput will be handled on best-effort, simplicity will be favored for this take home, for things like:
    - auth (carrying tenantId for implementatino simplicity in favor of auth consistency)
    - pagination
    - filtering
- Version numbers can be arbitrary
- Filtering is limited to (what i think) would be what is useful here:
    - Searching on the service name and description
    - Version count per service
    - Latest version created date range
    - Creation date range
- the number next to "versions" in the screenshot represents the total amount of versions

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
- tenantId: integer | index
- serviceId: integer | index
- version: string
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
- Body:
    - data: Version[]
    - next: string

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
    - sortBy: string
    - search: string
    - totalVersionFrom: int
    - totalVersionTo: int
    - createdAtFrom: string (iso timestamp)
    - createdAtTo: string (iso timestamp)
    - latestVersionCreatedAtFrom: string (iso timestamp)
    - latestVersionCreatedAtTo: string (iso timestamp)
- Body:
    - data: ListService[]
        - id
        - name
        - description
        - versionCount
    - next: string

**Error Responses:**
- 400: invalid query params
- 401: Auth token not provided or invalid
