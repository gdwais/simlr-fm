/**
 * Album Service
 * Orchestrates MusicBrainz, Cover Art Archive, and Album Repository
 */

import type { PrismaClient } from '@prisma/client';
import type {
  Album,
  AlbumDetail,
  AlbumSearchResult,
  Artist,
} from '../types/domain';
import { AlbumRepository } from '../repositories/album.repository';
import { MusicBrainzAdapter } from '../adapters/musicbrainz';
import { CoverArtAdapter } from '../adapters/coverart';

export class AlbumService {
  private albumRepo: AlbumRepository;

  constructor(
    private prisma: PrismaClient,
    private musicbrainzAdapter: MusicBrainzAdapter,
    private coverartAdapter: CoverArtAdapter
  ) {
    this.albumRepo = new AlbumRepository(prisma);
  }

  /**
   * Search for albums using MusicBrainz
   */
  async search(query: string, limit = 12): Promise<AlbumSearchResult[]> {
    // Search MusicBrainz
    const mbResults = await this.musicbrainzAdapter.searchReleaseGroups(
      query,
      limit
    );

    // Fetch cover art URLs in parallel
    const results = await Promise.all(
      mbResults.map(async (mb) => {
        const coverUrl = await this.coverartAdapter.getCoverArtUrl(
          mb.mbid,
          'large'
        );

        return {
          mbid: mb.mbid,
          title: mb.title,
          artists: [mb.primaryArtist],
          coverUrl,
          releaseYear: mb.releaseYear,
        };
      })
    );

    return results;
  }

  /**
   * Get album by MusicBrainz ID
   */
  async getByMbid(mbid: string): Promise<AlbumDetail | null> {
    // Check if album exists in database
    let album = await this.albumRepo.findByMbid(mbid);

    if (!album) {
      // Fetch from MusicBrainz and upsert
      album = await this.upsertByMbid(mbid);
      if (!album) {
        return null;
      }
    }

    // Get album stats
    const stats = await this.albumRepo.getStats(album.id);

    return {
      ...album,
      stats,
    };
  }

  /**
   * Get album by Spotify ID (legacy support)
   */
  async getBySpotifyId(spotifyId: string): Promise<AlbumDetail | null> {
    const album = await this.albumRepo.findBySpotifyId(spotifyId);

    if (!album) {
      return null;
    }

    const stats = await this.albumRepo.getStats(album.id);

    return {
      ...album,
      stats,
    };
  }

  /**
   * Get album by internal ID
   */
  async getById(id: string): Promise<AlbumDetail | null> {
    const album = await this.albumRepo.findById(id);

    if (!album) {
      return null;
    }

    const stats = await this.albumRepo.getStats(album.id);

    return {
      ...album,
      stats,
    };
  }

  /**
   * Fetch album from MusicBrainz and upsert to database
   */
  async upsertByMbid(mbid: string): Promise<Album | null> {
    // Fetch from MusicBrainz
    const releaseGroup = await this.musicbrainzAdapter.getReleaseGroup(mbid);

    if (!releaseGroup) {
      return null;
    }

    // Fetch cover art
    const coverUrl = await this.coverartAdapter.getCoverArtUrl(mbid, 'large');

    // Prepare artists data
    const artists: Artist[] = releaseGroup.artists.map((artist) => ({
      mbid: artist.mbid,
      name: artist.name,
    }));

    // Upsert album
    const album = await this.albumRepo.upsertByMbid({
      mbid: releaseGroup.mbid,
      title: releaseGroup.title,
      artists,
      coverUrl,
      releaseYear: releaseGroup.releaseYear,
      mbArtistId: releaseGroup.artists[0]?.mbid,
    });

    return album;
  }

  /**
   * Resolve album ID from MBID or Spotify ID
   * Used by rating/simlr/discussion routes during transition
   */
  async resolveAlbumId(identifier: string): Promise<string | null> {
    // Try MBID first
    const isMbid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

    if (isMbid) {
      let album = await this.albumRepo.findByMbid(identifier);
      if (!album) {
        // Fetch and upsert from MusicBrainz
        album = await this.upsertByMbid(identifier);
      }
      return album?.id || null;
    }

    // Try Spotify ID
    const isSpotifyId = /^[0-9A-Za-z]{22}$/.test(identifier);
    if (isSpotifyId) {
      const album = await this.albumRepo.findBySpotifyId(identifier);
      return album?.id || null;
    }

    return null;
  }
}

/**
 * Create album service instance
 */
export function createAlbumService(prisma: PrismaClient): AlbumService {
  return new AlbumService(
    prisma,
    new MusicBrainzAdapter(),
    new CoverArtAdapter()
  );
}
