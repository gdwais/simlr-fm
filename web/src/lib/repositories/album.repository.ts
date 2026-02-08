/**
 * Album Repository
 * Handles all database operations for albums
 */

import type { PrismaClient } from '@prisma/client';
import type { Album, AlbumStats, Artist, UpsertAlbumData } from '../types/domain';
import type { AlbumRepository as IAlbumRepository } from './types';
import { median } from '../stats';

export class AlbumRepository implements IAlbumRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find album by MusicBrainz ID
   */
  async findByMbid(mbid: string): Promise<Album | null> {
    const album = await this.prisma.album.findFirst({
      where: { mbid },
    });

    return album ? this.mapToAlbum(album) : null;
  }

  /**
   * Find album by Spotify ID (legacy support)
   */
  async findBySpotifyId(spotifyId: string): Promise<Album | null> {
    const album = await this.prisma.album.findUnique({
      where: { spotifyAlbumId: spotifyId },
    });

    return album ? this.mapToAlbum(album) : null;
  }

  /**
   * Find album by internal ID
   */
  async findById(id: string): Promise<Album | null> {
    const album = await this.prisma.album.findUnique({
      where: { id },
    });

    return album ? this.mapToAlbum(album) : null;
  }

  /**
   * Create or update album by MBID
   */
  async upsertByMbid(data: UpsertAlbumData): Promise<Album> {
    const artistsJson = JSON.parse(JSON.stringify(data.artists));

    const album = await this.prisma.album.upsert({
      where: { mbid: data.mbid },
      create: {
        mbid: data.mbid,
        spotifyAlbumId: data.mbid, // Temporary: use MBID as placeholder
        title: data.title,
        artistsJson,
        coverUrl: data.coverUrl,
        releaseYear: data.releaseYear,
        mbArtistId: data.mbArtistId,
      },
      update: {
        title: data.title,
        artistsJson,
        coverUrl: data.coverUrl,
        releaseYear: data.releaseYear,
        mbArtistId: data.mbArtistId,
      },
    });

    return this.mapToAlbum(album);
  }

  /**
   * Get statistics for an album
   */
  async getStats(albumId: string): Promise<AlbumStats> {
    const ratings = await this.prisma.rating.findMany({
      where: { albumId },
      select: { score: true },
    });

    if (ratings.length === 0) {
      return {
        ratingCount: 0,
        averageRating: null,
        medianRating: null,
        histogram: {},
      };
    }

    const scores = ratings.map((r) => r.score);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const averageRating = sum / scores.length;
    const medianRating = median(scores);

    // Build histogram: rating -> count
    const histogram: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      histogram[i] = 0;
    }
    scores.forEach((score) => {
      histogram[score] = (histogram[score] || 0) + 1;
    });

    return {
      ratingCount: ratings.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      medianRating,
      histogram,
    };
  }

  /**
   * Map Prisma album to domain Album
   */
  private mapToAlbum(album: {
    id: string;
    mbid: string | null;
    spotifyAlbumId: string | null;
    title: string;
    artistsJson: unknown;
    coverUrl: string | null;
    releaseYear: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): Album {
    return {
      id: album.id,
      mbid: album.mbid,
      spotifyAlbumId: album.spotifyAlbumId,
      title: album.title,
      artists: Array.isArray(album.artistsJson)
        ? (album.artistsJson as Artist[])
        : [],
      coverUrl: album.coverUrl,
      releaseYear: album.releaseYear,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
    };
  }
}
