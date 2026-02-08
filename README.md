# Simlr.fm

A music rating and discovery platform powered by MusicBrainz.

## Features

- 🎵 **Album Search** - Search albums using the MusicBrainz database
- ⭐ **Ratings** - Rate albums on a scale of 1-10
- 🔗 **Simlrs** - Connect similar albums with reasons
- 💬 **Discussion** - Create threads and discuss albums
- 🏆 **Rushmore** - Pick your top 4 albums
- 🔐 **JWT Auth** - Secure email/password authentication

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **External APIs**: MusicBrainz, Cover Art Archive
- **Authentication**: Custom JWT-based auth
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- OpenSSL (for generating JWT secret)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd simlr-fm
   ```

2. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables**
   ```bash
   cd web
   cp .env.example .env
   ```

   Generate a JWT secret:
   ```bash
   openssl rand -base64 32
   ```

   Update `.env` with your JWT_SECRET:
   ```
   DATABASE_URL="postgresql://simlr:simlr@localhost:5436/simlr?schema=public"
   JWT_SECRET="<your-generated-secret>"
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the app**
   ```
   http://localhost:3000
   ```

## Development

### Running Tests

```bash
npm test              # Run tests once
npm test -- --watch   # Run in watch mode
npm run test:ui       # Open test UI
```

### Database Management

```bash
npx prisma studio     # Open Prisma Studio
npx prisma migrate dev --name <migration-name>  # Create migration
npx prisma generate   # Regenerate Prisma Client
```

## Architecture

```
Routes (API)
    ↓
Services (Business Logic)
    ↓
Repositories (Data)  +  Adapters (External APIs)
    ↓                       ↓
Database            MusicBrainz + Cover Art Archive
```

### Key Directories

- `/web/src/app/` - Next.js pages and API routes
- `/web/src/lib/services/` - Business logic layer
- `/web/src/lib/repositories/` - Database access layer
- `/web/src/lib/adapters/` - External API integrations
- `/web/src/components/` - React components
- `/web/tests/` - Vitest test files

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile

### Albums

- `GET /api/albums/search?q=<query>` - Search albums (MusicBrainz)
- `POST /api/albums/[id]/upsert` - Upsert album by MBID
- `GET /api/albums/[id]/stats` - Get album statistics

### Ratings

- `POST /api/ratings` - Create/update rating

### Simlrs

- `POST /api/simlrs` - Add similarity connection

### Discussion

- `GET /api/posts?albumId=<id>` - Get posts for album
- `POST /api/posts` - Create post
- `POST /api/comments` - Add comment
- `POST /api/votes` - Vote on post/comment

## License

Private side project

## Contributing

This is a personal project. Not accepting contributions at this time.