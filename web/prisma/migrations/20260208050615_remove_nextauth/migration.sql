-- AlterTable
ALTER TABLE "Album" ALTER COLUMN "spotifyAlbumId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "accounts",
DROP COLUMN IF EXISTS "sessions";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "VerificationToken";

-- DropTable
DROP TABLE IF EXISTS "Session";

-- DropTable
DROP TABLE IF EXISTS "Account";
