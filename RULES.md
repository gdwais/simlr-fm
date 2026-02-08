# Simlr.fm Project Rules & Conventions

This document defines the coding standards and architectural patterns for this project. These rules are automatically checked by the validation script and git hooks.

## Architecture Rules

### Layered Architecture (ENFORCE)
- ✅ **DO**: Follow the layered architecture pattern
  - Routes → Services → Repositories/Adapters → Database/External APIs
- ❌ **DON'T**: Call Prisma directly from route handlers
- ❌ **DON'T**: Call external APIs directly from routes
- ❌ **DON'T**: Put business logic in route handlers

### Service Layer (ENFORCE)
- ✅ **DO**: Create services for business logic
- ✅ **DO**: Make services accept dependencies via constructor (dependency injection)
- ✅ **DO**: Write unit tests for all services
- ❌ **DON'T**: Access Prisma directly from services (use repositories)

### Repository Pattern (ENFORCE)
- ✅ **DO**: Use repositories for all database access
- ✅ **DO**: Return domain objects from repositories, not raw Prisma types
- ✅ **DO**: Accept PrismaClient via constructor for testability
- ❌ **DON'T**: Put business logic in repositories
- ❌ **DON'T**: Return Prisma types directly

### Adapter Pattern (ENFORCE)
- ✅ **DO**: Create adapters for external API integrations
- ✅ **DO**: Make adapters mockable for testing
- ✅ **DO**: Handle rate limiting in adapters
- ❌ **DON'T**: Expose raw API response types

## Database Rules

### Prisma Schema Conventions (ENFORCE)
- ✅ **DO**: Use `@@map()` to map models to snake_case plural table names
  ```prisma
  model User {
    id String @id
    @@map("users")
  }
  ```
- ✅ **DO**: Use `@map()` to map fields to snake_case column names
  ```prisma
  model Album {
    albumId String @map("album_id")
    createdAt DateTime @map("created_at")
  }
  ```
- ❌ **DON'T**: Use camelCase table names in database
- ❌ **DON'T**: Use camelCase column names in database

### Database Naming (ENFORCE)
- Table names: snake_case, plural (e.g., `users`, `refresh_tokens`)
- Column names: snake_case (e.g., `user_id`, `created_at`)
- Model names in Prisma: PascalCase, singular (e.g., `User`, `RefreshToken`)
- Field names in Prisma: camelCase (e.g., `userId`, `createdAt`)

## Code Style Rules

### File Organization (RECOMMEND)
- ✅ **DO**: Group related code in directories
- ✅ **DO**: Use barrel exports for clean imports
- ❌ **DON'T**: Create deeply nested directory structures

### TypeScript (ENFORCE)
- ✅ **DO**: Define proper TypeScript interfaces
- ✅ **DO**: Use domain types instead of Prisma types in services
- ❌ **DON'T**: Use `any` type (use `unknown` if needed)
- ❌ **DON'T**: Disable TypeScript errors

### Testing (ENFORCE)
- ✅ **DO**: Write unit tests for services, repositories, adapters
- ✅ **DO**: Mock dependencies in unit tests
- ✅ **DO**: Aim for >80% coverage on business logic
- ❌ **DON'T**: Skip tests for new services/repositories

## API Route Rules

### Authentication (ENFORCE)
- ✅ **DO**: Use JWT-based authentication
- ✅ **DO**: Use `getCurrentUser()` for server components
- ✅ **DO**: Use `withAuth()` middleware for protected API routes
- ❌ **DON'T**: Use NextAuth or session-based auth
- ❌ **DON'T**: Store sensitive data in JWT payload

### Route Structure (RECOMMEND)
- ✅ **DO**: Keep route handlers thin (validate, call service, return response)
- ✅ **DO**: Use Zod for input validation
- ✅ **DO**: Return consistent error formats
- ❌ **DON'T**: Put complex logic in route handlers

## External API Rules

### MusicBrainz (ENFORCE)
- ✅ **DO**: Respect 1 request/second rate limit
- ✅ **DO**: Set proper User-Agent header
- ✅ **DO**: Cache responses in database
- ❌ **DON'T**: Make parallel requests to MusicBrainz
- ❌ **DON'T**: Skip rate limiting

### Cover Art Archive (RECOMMEND)
- ✅ **DO**: Handle 404s gracefully (no cover art available)
- ✅ **DO**: Use appropriate image sizes
- ❌ **DON'T**: Fail page render on missing cover art

## Dependency Rules

### Banned Dependencies (ENFORCE)
- ❌ **DON'T**: Add Spotify API dependencies
- ❌ **DON'T**: Add NextAuth or other OAuth libraries
- ❌ **DON'T**: Add unnecessary heavy dependencies

### Preferred Dependencies (RECOMMEND)
- ✅ **DO**: Use Zod for validation
- ✅ **DO**: Use Prisma for database access
- ✅ **DO**: Use bcrypt for password hashing
- ✅ **DO**: Use jsonwebtoken for JWT

## Security Rules

### Authentication (ENFORCE)
- ✅ **DO**: Hash passwords with bcrypt (cost factor 12)
- ✅ **DO**: Use HTTP-only cookies for tokens
- ✅ **DO**: Validate all user input with Zod
- ✅ **DO**: Use parameterized queries (Prisma handles this)
- ❌ **DON'T**: Store passwords in plain text
- ❌ **DON'T**: Log sensitive information
- ❌ **DON'T**: Expose internal IDs in public APIs

### API Security (ENFORCE)
- ✅ **DO**: Require authentication for write operations
- ✅ **DO**: Validate ownership before updates/deletes
- ❌ **DON'T**: Trust client-side validation alone
- ❌ **DON'T**: Expose stack traces in production

## Git Rules

### Commit Messages (RECOMMEND)
- ✅ **DO**: Use descriptive commit messages
- ✅ **DO**: Use conventional commits format (feat:, fix:, refactor:, etc.)
- ❌ **DON'T**: Commit with vague messages like "fix" or "wip"

### Branches (RECOMMEND)
- ✅ **DO**: Create feature branches for new work
- ✅ **DO**: Keep commits focused and atomic
- ❌ **DON'T**: Commit directly to main for large changes

## Documentation Rules

### Code Comments (RECOMMEND)
- ✅ **DO**: Add JSDoc comments to public functions
- ✅ **DO**: Explain "why" not "what" in comments
- ❌ **DON'T**: Add obvious comments
- ❌ **DON'T**: Leave commented-out code

### README (ENFORCE)
- ✅ **DO**: Keep README up to date
- ✅ **DO**: Document setup steps clearly
- ❌ **DON'T**: Include outdated information

---

## Verification Rules

### Build & Lint (ENFORCE)
- ✅ **DO**: Run build and lint after making changes
- ✅ **DO**: Fix all lint errors before committing
- ✅ **DO**: Ensure the project builds without errors
- ❌ **DON'T**: Commit code that doesn't build
- ❌ **DON'T**: Ignore TypeScript or ESLint errors

**After making changes, always run:**
```bash
npm run build    # Ensure project builds
npm run lint     # Check for lint errors
npm run test     # Run tests
```

---

## Rule Enforcement

Rules are checked automatically via:
- Claude Code hooks: Runs validation periodically during sessions
- Manual check: `npm run validate:rules`
- Build validation: `npm run build && npm run lint`
- CI/CD: (Future) Runs on pull requests

To check rules manually:
```bash
npm run validate:rules
npm run build
npm run lint
```
