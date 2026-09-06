# Handoff: Kong take-home service catalog

## Workspace state

- Branch: `main`.
- Exercise requirements: [`docs/exercise.md`](exercise.md).
- Agreed MVP API/data design and assumptions: [`docs/design.md`](design.md). Read these rather than reconstructing the requirements from this handoff.
- NestJS v9 scaffold and dependencies were committed in `3306484` (`initial nest scaffold`).
- The project uses NestJS 9, `@nestjs/config` 2, `@nestjs/typeorm` 9, TypeORM 0.3, PostgreSQL driver `pg`, pnpm, Jest, ESLint, and the generated strict TypeScript settings.
- `ConfigModule` is registered globally in `src/app.module.ts`.

## Conversation context

The user is new to NestJS and TypeORM but familiar with Python ORMs such as SQLAlchemy and SQLModel. They prefer to understand concepts and design before implementation. Explain unfamiliar Nest/TypeORM concepts plainly and relate TypeORM concepts to SQLAlchemy where useful.

Concepts already covered:

- Nest modules, controllers, application services, providers, dependency injection, `@Injectable()`, `forRoot()`, `forRootAsync()`, `forFeature()`, and global modules.
- `AppModule` as the root composition module.
- `@nestjs/config` as an optional official package that loads, structures, validates, and exposes configuration through dependency injection.
- TypeORM entities, `DataSource`, `EntityManager`, repositories, relations, query builder, DTO/entity separation, transactions, and migrations.
- `@nestjs/typeorm` injects ordinary TypeORM repositories and manages their lifecycle; it does not add query functionality.

## Current architectural direction

The user currently favors one `ServicesModule` because versions are subordinate to services, with:

- one `ServicesController`, including `GET /services/:serviceId/versions`;
- one application service;
- injected `Repository<Service>` and `Repository<Version>` from TypeORM, not custom repository wrapper classes unless later justified;
- `AppModule` responsible for infrastructure/root composition;
- `ServicesModule` responsible for feature entities, repositories, controller, and application service.

The list query will require joins/aggregation for version count, latest-version filtering, and sorting. Repository boundaries must not force inefficient separate queries. Tenant scoping is explicit in every applicable query and is not supplied by TypeORM automatically.

## Likely next steps

Do not implement merely because these are listed; wait for an explicit request, per project instructions.

1. Finish discussing or configure centralized environment settings (`PORT`, `DATABASE_URL`, `JWT_SECRET`) with validation.
2. Add `TypeOrmModule.forRootAsync(...)` to `AppModule` and `TypeOrmModule.forFeature(...)` to a feature module.
3. Establish the feature directory and entities from `docs/design.md`.
4. Decide migration CLI/`DataSource` layout and add the initial migration; avoid relying on `synchronize: true` for the submitted project.
5. Add DTO validation, query construction, demo JWT guard, and tests incrementally.

## Important interaction constraints

- Do not implement, design, or modify code unless explicitly asked. Discussion alone should remain discussion.
- Use `rg`, not `grep`; use `fd`, not `find`; use `gh` first for GitHub operations.
- If asked to commit and push, inspect the diff and run appropriate checks first.

## Suggested skills

- **domain-modeling**: invoke if the user wants to sharpen terminology, entity relationships, invariants, or record an architectural decision.
- **code-review**: invoke when the user asks to review implementation or a branch against the exercise and repository standards.
- **research**: invoke if the user requests a sourced investigation into NestJS 9 or TypeORM 0.3 APIs and wants findings captured in the repository.
