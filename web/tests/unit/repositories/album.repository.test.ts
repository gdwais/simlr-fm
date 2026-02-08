import { describe, it, expect, beforeEach } from 'vitest';
import { AlbumRepository } from '@/lib/repositories/album.repository';
import { createMockPrisma } from '../../helpers/mock-prisma';
import type { Artist } from '@/lib/types/domain';

describe('AlbumRepository', () => {
  let repository: AlbumRepository;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new AlbumRepository(mockPrisma as any);
  });

  describe('findByMbid', () => {
    it('should find album by MBID', async () => {
      const mockAlbum = {
        id: 'album-1',
        mbid: '12345-abcde',
        spotifyAlbumId: 'spotify-123',
        title: 'OK Computer',
        artistsJson: [{ mbid: 'artist-1', name: 'Radiohead' }],
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 1997,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.album.findFirst.mockResolvedValueOnce(mockAlbum);

      const result = await repository.findByMbid('12345-abcde');

      expect(result).toEqual({
        id: 'album-1',
        mbid: '12345-abcde',
        spotifyAlbumId: 'spotify-123',
        title: 'OK Computer',
        artists: [{ mbid: 'artist-1', name: 'Radiohead' }],
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 1997,
        createdAt: mockAlbum.createdAt,
        updatedAt: mockAlbum.updatedAt,
      });

      expect(mockPrisma.album.findFirst).toHaveBeenCalledWith({
        where: { mbid: '12345-abcde' },
      });
    });

    it('should return null when album not found', async () => {
      mockPrisma.album.findFirst.mockResolvedValueOnce(null);

      const result = await repository.findByMbid('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySpotifyId', () => {
    it('should find album by Spotify ID', async () => {
      const mockAlbum = {
        id: 'album-1',
        mbid: null,
        spotifyAlbumId: 'spotify-123',
        title: 'Test Album',
        artistsJson: [{ mbid: 'artist-1', name: 'Test Artist' }],
        coverUrl: null,
        releaseYear: 2020,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.album.findUnique.mockResolvedValueOnce(mockAlbum);

      const result = await repository.findBySpotifyId('spotify-123');

      expect(result?.spotifyAlbumId).toBe('spotify-123');
      expect(mockPrisma.album.findUnique).toHaveBeenCalledWith({
        where: { spotifyAlbumId: 'spotify-123' },
      });
    });
  });

  describe('upsertByMbid', () => {
    it('should create new album', async () => {
      const artists: Artist[] = [{ mbid: 'artist-1', name: 'Test Artist' }];
      const mockAlbum = {
        id: 'album-1',
        mbid: '12345-abcde',
        spotifyAlbumId: '12345-abcde',
        title: 'New Album',
        artistsJson: artists,
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 2024,
        mbArtistId: 'artist-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.album.upsert.mockResolvedValueOnce(mockAlbum);

      const result = await repository.upsertByMbid({
        mbid: '12345-abcde',
        title: 'New Album',
        artists,
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 2024,
        mbArtistId: 'artist-1',
      });

      expect(result.title).toBe('New Album');
      expect(result.artists).toEqual(artists);
    });

    it('should update existing album', async () => {
      const artists: Artist[] = [{ mbid: 'artist-1', name: 'Updated Artist' }];
      const mockAlbum = {
        id: 'album-1',
        mbid: '12345-abcde',
        spotifyAlbumId: 'spotify-123',
        title: 'Updated Album',
        artistsJson: artists,
        coverUrl: 'https://example.com/new-cover.jpg',
        releaseYear: 2024,
        mbArtistId: 'artist-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.album.upsert.mockResolvedValueOnce(mockAlbum);

      const result = await repository.upsertByMbid({
        mbid: '12345-abcde',
        title: 'Updated Album',
        artists,
        coverUrl: 'https://example.com/new-cover.jpg',
        releaseYear: 2024,
      });

      expect(result.title).toBe('Updated Album');
    });
  });

  describe('getStats', () => {
    it('should calculate album statistics', async () => {
      const mockRatings = [
        { score: 8 },
        { score: 9 },
        { score: 7 },
        { score: 8 },
        { score: 10 },
      ];

      mockPrisma.rating.findMany.mockResolvedValueOnce(mockRatings);

      const result = await repository.getStats('album-1');

      expect(result.ratingCount).toBe(5);
      expect(result.averageRating).toBe(8.4);
      expect(result.medianRating).toBe(8);
      expect(result.histogram[8]).toBe(2);
      expect(result.histogram[9]).toBe(1);
    });

    it('should return empty stats when no ratings', async () => {
      mockPrisma.rating.findMany.mockResolvedValueOnce([]);

      const result = await repository.getStats('album-1');

      expect(result.ratingCount).toBe(0);
      expect(result.averageRating).toBeNull();
      expect(result.medianRating).toBeNull();
      expect(result.histogram).toEqual({});
    });
  });
});
