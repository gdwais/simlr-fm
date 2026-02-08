# MusicBrainz Migration — PRD

**Owner:** Dalton Wais  
**Status:** Draft  
**Last updated:** 2026-02-07

---

## 1) Summary

Migrate Simlr.fm from Spotify API to **MusicBrainz + Cover Art Archive** for album/artist metadata. Replace Spotify OAuth with a simple **email/password authentication** system.

This migration prioritizes:
- Clean separation of concerns (Repository → Service → Route)
- Adapter pattern for external APIs (easy to swap/mock)
- Testability in isolation
- Simple, expandable auth

---

## 2) Goals

1. **Remove Spotify dependency** — use MusicBrainz for all album/artist data
2. **Add standalone auth** — email/password registration and login
3. **Clean architecture** — layered design that supports unit testing
4. **Maintain feature parity** — search, album pages, ratings, simlrs, discussion all still work

---

## 3) Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Routes (API)                         │
│   /api/auth/*  /api/albums/*  /api/search/*  /api/users/*   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│   AuthService  AlbumService  SearchService  UserService     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Repositories  │ │    Adapters     │ │    Utilities    │
│                 │ │                 │ │                 │
│ UserRepository  │ │ MusicBrainz     │ │ PasswordHasher  │
│ AlbumRepository │ │ Adapter         │ │ TokenManager    │
│ RatingRepository│ │                 │ │                 │
│ SimlrRepository │ │ CoverArtArchive │ │                 │
│ PostRepository  │ │ Adapter         │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│         MusicBrainz API       Cover Art Archive             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4) Layer Definitions

### 4.1 Routes (API Layer)
- Thin handlers that validate input, call services, return responses
- No business logic
- No direct database access
- No direct external API calls

### 4.2 Service Layer
- Contains business logic
- Orchestrates repositories and adapters
- Handles caching decisions
- Transaction boundaries

### 4.3 Repositories
- Data access abstraction over Prisma
- One repository per domain entity
- Returns domain objects, not Prisma types directly
- Easy to mock for testing

### 4.4 Adapters
- Wrap external APIs (MusicBrainz, Cover Art Archive)
- Normalize external data into internal types
- Handle retries, rate limiting, error mapping
- Easy to mock for testing

---

## 5) Authentication System

### 5.1 Overview
Simple email/password auth with JWT sessions. No OAuth for MVP.

### 5.2 User Model Changes
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  username      String?   @unique
  displayName   String?
  avatarUrl     String?
  emailVerified DateTime?
  
  // ... existing relations
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 5.3 Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (email, password, username) |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |

### 5.4 Session Management
- JWT stored in httpOnly cookie
- Short-lived access token (15 min)
- Refresh token rotation (7 days)
- Middleware validates token on protected routes

### 5.5 Password Requirements (MVP)
- Minimum 8 characters
- Hashed with bcrypt (cost factor 12)

---

## 6) MusicBrainz Integration

### 6.1 MusicBrainz Adapter

```typescript
interface MusicBrainzAdapter {
  searchReleaseGroups(query: string, limit?: number): Promise<ReleaseGroupSearchResult[]>
  getReleaseGroup(mbid: string): Promise<ReleaseGroup | null>
  searchArtists(query: string, limit?: number): Promise<ArtistSearchResult[]>
  getArtist(mbid: string): Promise<Artist | null>
}
```

### 6.2 Cover Art Archive Adapter

```typescript
interface CoverArtAdapter {
  getCoverArt(releaseGroupMbid: string): Promise<CoverArt | null>
  getCoverArtUrl(releaseGroupMbid: string, size?: 'small' | 'large'): Promise<string | null>
}
```

### 6.3 Data Mapping

| Spotify Concept | MusicBrainz Equivalent |
|-----------------|------------------------|
| Album | Release Group |
| Album ID | Release Group MBID |
| Artist | Artist |
| Artist ID | Artist MBID |
| Cover Art | Cover Art Archive (by MBID) |

### 6.4 Rate Limiting
- MusicBrainz: 1 request/second (be polite)
- Cover Art Archive: No strict limit, but cache aggressively
- Implement request queue with delay

---

## 7) Database Changes

### 7.1 Album Model Update
```prisma
model Album {
  id              String   @id @default(cuid())
  mbid            String   @unique  // MusicBrainz Release Group ID
  spotifyAlbumId  String?  @unique  // Keep for legacy, nullable
  title           String
  artistsJson     Json
  coverUrl        String?
  releaseYear     Int?
  mbArtistId      String?  // Primary artist MBID
  
  // ... existing relations
}
```

### 7.2 Migration Strategy
1. Add new `mbid` column (nullable initially)
2. Add `mbArtistId` column
3. For existing albums, attempt to match via title/artist search
4. Make `spotifyAlbumId` nullable
5. New albums use MBID as primary identifier

---

## 8) File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── albums/
│   │   │   ├── [mbid]/route.ts
│   │   │   └── search/route.ts
│   │   └── ... (existing routes)
│   └── ... (pages)
├── lib/
│   ├── adapters/
│   │   ├── musicbrainz.ts
│   │   ├── coverart.ts
│   │   └── types.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── album.repository.ts
│   │   ├── rating.repository.ts
│   │   ├── simlr.repository.ts
│   │   └── post.repository.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── album.service.ts
│   │   ├── search.service.ts
│   │   └── user.service.ts
│   ├── utils/
│   │   ├── password.ts
│   │   ├── token.ts
│   │   └── validation.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── types/
│       └── index.ts
└── tests/
    ├── adapters/
    ├── repositories/
    ├── services/
    └── routes/
```

---

## 9) Testing Strategy

### 9.1 Unit Tests
- **Adapters:** Mock HTTP calls, test parsing/error handling
- **Repositories:** Mock Prisma client, test query logic
- **Services:** Mock repositories + adapters, test business logic
- **Utils:** Pure functions, direct testing

### 9.2 Integration Tests
- Test routes with real services but mocked external APIs
- Test database operations with test database

### 9.3 Mocking Approach
Each layer has an interface, implementation uses dependency injection:
```typescript
// Service accepts adapters/repos via constructor or params
const albumService = new AlbumService({
  albumRepo: mockAlbumRepo,
  musicBrainzAdapter: mockMBAdapter,
  coverArtAdapter: mockCAAdapter,
});
```

---

## 10) Implementation Phases

### Phase 1: Foundation
1. Set up file structure (adapters/, repositories/, services/)
2. Implement MusicBrainz adapter
3. Implement Cover Art Archive adapter
4. Add adapter tests

### Phase 2: Auth System
1. Update User model (email, passwordHash)
2. Implement auth utilities (password hashing, JWT)
3. Implement AuthService
4. Implement auth routes
5. Add auth middleware
6. Add auth tests

### Phase 3: Album Migration
1. Update Album model (add mbid, make spotifyAlbumId nullable)
2. Implement AlbumRepository
3. Implement AlbumService (uses MB adapter)
4. Update search route to use MusicBrainz
5. Update album page to use MBID
6. Add album tests

### Phase 4: Cleanup
1. Remove Spotify adapter code
2. Remove Spotify OAuth
3. Update UI for email/password auth
4. Migration script for existing data (optional)

---

## 11) API Examples

### Search Albums
```
GET /api/albums/search?q=radiohead+in+rainbows

Response:
{
  "results": [
    {
      "mbid": "7c3c3c3c-...",
      "title": "In Rainbows",
      "artists": [{ "mbid": "a74b1b7f-...", "name": "Radiohead" }],
      "releaseYear": 2007,
      "coverUrl": "https://coverartarchive.org/..."
    }
  ]
}
```

### Get Album
```
GET /api/albums/7c3c3c3c-...

Response:
{
  "mbid": "7c3c3c3c-...",
  "title": "In Rainbows",
  "artists": [...],
  "releaseYear": 2007,
  "coverUrl": "...",
  "stats": { "avgRating": 8.7, "ratingCount": 142 },
  "simlrs": [...],
  "posts": [...]
}
```

### Register
```
POST /api/auth/register
{ "email": "user@example.com", "password": "...", "username": "cooluser" }

Response:
{ "user": { "id": "...", "email": "...", "username": "..." }, "token": "..." }
```

---

## 12) Open Questions

1. **Email verification?** — Skip for MVP, add later?
2. **Password reset?** — Skip for MVP?
3. **Rate limit caching?** — Redis or in-memory for MVP?
4. **Legacy Spotify data?** — Migrate existing albums or start fresh?

---

## 13) Dependencies to Add

```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.6"
}
```

Remove:
- `spotify-web-api-node`
- `@types/spotify-web-api-node`
- `next-auth` (replace with custom auth)
- `@next-auth/prisma-adapter`

---

## 14) Success Criteria

- [ ] Can search albums via MusicBrainz
- [ ] Album pages load with cover art from CAA
- [ ] Users can register with email/password
- [ ] Users can login and maintain session
- [ ] All existing features (ratings, simlrs, discussion) work
- [ ] Adapters/services have unit tests
- [ ] No Spotify API calls remain
