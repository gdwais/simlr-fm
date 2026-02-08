/*
  Warnings:

  - You are about to drop the `Album` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RushmoreSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SimlrEdge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SimlrReason` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_albumId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_albumId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "RushmoreSlot" DROP CONSTRAINT "RushmoreSlot_albumId_fkey";

-- DropForeignKey
ALTER TABLE "RushmoreSlot" DROP CONSTRAINT "RushmoreSlot_userId_fkey";

-- DropForeignKey
ALTER TABLE "SimlrEdge" DROP CONSTRAINT "SimlrEdge_sourceAlbumId_fkey";

-- DropForeignKey
ALTER TABLE "SimlrEdge" DROP CONSTRAINT "SimlrEdge_targetAlbumId_fkey";

-- DropForeignKey
ALTER TABLE "SimlrReason" DROP CONSTRAINT "SimlrReason_edgeId_fkey";

-- DropForeignKey
ALTER TABLE "SimlrReason" DROP CONSTRAINT "SimlrReason_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- DropTable
DROP TABLE "Album";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Rating";

-- DropTable
DROP TABLE "RefreshToken";

-- DropTable
DROP TABLE "RushmoreSlot";

-- DropTable
DROP TABLE "SimlrEdge";

-- DropTable
DROP TABLE "SimlrReason";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Vote";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "image" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "mbid" TEXT,
    "spotify_album_id" TEXT,
    "title" TEXT NOT NULL,
    "artists_json" JSONB NOT NULL,
    "cover_url" TEXT,
    "release_year" INTEGER,
    "mb_artist_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simlr_edges" (
    "id" TEXT NOT NULL,
    "source_album_id" TEXT NOT NULL,
    "target_album_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simlr_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simlr_reasons" (
    "id" TEXT NOT NULL,
    "edge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simlr_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" "VoteEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rushmore_slots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "album_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rushmore_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "albums_mbid_key" ON "albums"("mbid");

-- CreateIndex
CREATE UNIQUE INDEX "albums_spotify_album_id_key" ON "albums"("spotify_album_id");

-- CreateIndex
CREATE INDEX "albums_mbid_idx" ON "albums"("mbid");

-- CreateIndex
CREATE INDEX "albums_spotify_album_id_idx" ON "albums"("spotify_album_id");

-- CreateIndex
CREATE INDEX "ratings_album_id_idx" ON "ratings"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_album_id_key" ON "ratings"("user_id", "album_id");

-- CreateIndex
CREATE INDEX "simlr_edges_source_album_id_idx" ON "simlr_edges"("source_album_id");

-- CreateIndex
CREATE INDEX "simlr_edges_target_album_id_idx" ON "simlr_edges"("target_album_id");

-- CreateIndex
CREATE UNIQUE INDEX "simlr_edges_source_album_id_target_album_id_key" ON "simlr_edges"("source_album_id", "target_album_id");

-- CreateIndex
CREATE INDEX "simlr_reasons_edge_id_idx" ON "simlr_reasons"("edge_id");

-- CreateIndex
CREATE UNIQUE INDEX "simlr_reasons_edge_id_user_id_key" ON "simlr_reasons"("edge_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_album_id_idx" ON "posts"("album_id");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "votes_entity_type_entity_id_idx" ON "votes"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_entity_type_entity_id_key" ON "votes"("user_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "rushmore_slots_user_id_idx" ON "rushmore_slots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rushmore_slots_user_id_slot_key" ON "rushmore_slots"("user_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "rushmore_slots_user_id_album_id_key" ON "rushmore_slots"("user_id", "album_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simlr_edges" ADD CONSTRAINT "simlr_edges_source_album_id_fkey" FOREIGN KEY ("source_album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simlr_edges" ADD CONSTRAINT "simlr_edges_target_album_id_fkey" FOREIGN KEY ("target_album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simlr_reasons" ADD CONSTRAINT "simlr_reasons_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "simlr_edges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simlr_reasons" ADD CONSTRAINT "simlr_reasons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rushmore_slots" ADD CONSTRAINT "rushmore_slots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rushmore_slots" ADD CONSTRAINT "rushmore_slots_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
