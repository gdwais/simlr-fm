import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlbumService } from '@/lib/services/album.service';
import { createMockPrisma } from '../../helpers/mock-prisma';
import { MusicBrainzAdapter } from '@/lib/adapters/musicbrainz';
import { CoverArtAdapter } from '@/lib/adapters/coverart';

vi.mock('@/lib/adapters/musicbrainz');
vi.mock('@/lib/adapters/coverart');

describe('AlbumService', () => {
  let service: AlbumService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockMusicBrainz: MusicBrainzAdapter;
  let mockCoverArt: CoverArtAdapter;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockMusicBrainz = new MusicBrainzAdapter();
    mockCoverArt = new CoverArtAdapter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AlbumService(mockPrisma as any, mockMusicBrainz, mockCoverArt);
  });

  describe('search', () => {
    it('should search albums and fetch cover art', async () => {
      const mbResults = [
        {
          mbid: 'mb-123',
          title: 'OK Computer',
          primaryArtist: { mbid: 'artist-123', name: 'Radiohead' },
          releaseYear: 1997,
        },
      ];

      vi.spyOn(mockMusicBrainz, 'searchReleaseGroups').mockResolvedValue(mbResults);
      vi.spyOn(mockCoverArt, 'getCoverArtUrl').mockResolvedValue('https://example.com/cover.jpg');

      const results = await service.search('radiohead ok computer');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        mbid: 'mb-123',
        title: 'OK Computer',
        artists: [{ mbid: 'artist-123', name: 'Radiohead' }],
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 1997,
      });

      expect(mockMusicBrainz.searchReleaseGroups).toHaveBeenCalledWith(
        'radiohead ok computer',
        12
      );
      expect(mockCoverArt.getCoverArtUrl).toHaveBeenCalledWith('mb-123', 'large');
    });

    it('should handle missing cover art', async () => {
      const mbResults = [
        {
          mbid: 'mb-123',
          title: 'Test Album',
          primaryArtist: { mbid: 'artist-123', name: 'Test Artist' },
          releaseYear: 2020,
        },
      ];

      vi.spyOn(mockMusicBrainz, 'searchReleaseGroups').mockResolvedValue(mbResults);
      vi.spyOn(mockCoverArt, 'getCoverArtUrl').mockResolvedValue(null);

      const results = await service.search('test');

      expect(results[0].coverUrl).toBeNull();
    });
  });

  describe('getByMbid', () => {
    it('should return album from database if it exists', async () => {
      const mockAlbum = {
        id: 'album-1',
        mbid: 'mb-123',
        spotifyAlbumId: 'spotify-123',
        title: 'OK Computer',
        artists: [{ mbid: 'artist-123', name: 'Radiohead' }],
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 1997,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.album.findFirst.mockResolvedValue(mockAlbum as any);
      mockPrisma.rating.findMany.mockResolvedValue([
        { score: 8 },
        { score: 9 },
        { score: 10 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any);

      const result = await service.getByMbid('mb-123');

      expect(result?.mbid).toBe('mb-123');
      expect(result?.title).toBe('OK Computer');
      expect(result?.stats.ratingCount).toBeGreaterThan(0);
    });

    it('should fetch from MusicBrainz if not in database', async () => {
      const mbReleaseGroup = {
        mbid: 'mb-123',
        title: 'In Rainbows',
        artists: [{ mbid: 'artist-123', name: 'Radiohead' }],
        releaseYear: 2007,
        primaryType: 'Album',
      };

      mockPrisma.album.findFirst.mockResolvedValueOnce(null); // Not in DB
      vi.spyOn(mockMusicBrainz, 'getReleaseGroup').mockResolvedValue(mbReleaseGroup);
      vi.spyOn(mockCoverArt, 'getCoverArtUrl').mockResolvedValue('https://example.com/cover.jpg');

      mockPrisma.album.upsert.mockResolvedValue({
        id: 'album-1',
        mbid: 'mb-123',
        spotifyAlbumId: 'mb-123',
        title: 'In Rainbows',
        artistsJson: [{ mbid: 'artist-123', name: 'Radiohead' }],
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 2007,
        mbArtistId: 'artist-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      mockPrisma.rating.findMany.mockResolvedValue([]);

      const result = await service.getByMbid('mb-123');

      expect(result?.title).toBe('In Rainbows');
      expect(mockMusicBrainz.getReleaseGroup).toHaveBeenCalledWith('mb-123');
      expect(mockPrisma.album.upsert).toHaveBeenCalled();
    });

    it('should return null if album not found in MusicBrainz', async () => {
      mockPrisma.album.findFirst.mockResolvedValue(null);
      vi.spyOn(mockMusicBrainz, 'getReleaseGroup').mockResolvedValue(null);

      const result = await service.getByMbid('nonexistent-mbid');

      expect(result).toBeNull();
    });
  });

  describe('getBySpotifyId', () => {
    it('should return album by Spotify ID', async () => {
      const mockAlbum = {
        id: 'album-1',
        mbid: null,
        spotifyAlbumId: 'spotify-123',
        title: 'Legacy Album',
        artists: [{ mbid: 'artist-123', name: 'Test Artist' }],
        coverUrl: null,
        releaseYear: 2020,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum as any);
      mockPrisma.rating.findMany.mockResolvedValue([]);

      const result = await service.getBySpotifyId('spotify-123');

      expect(result?.spotifyAlbumId).toBe('spotify-123');
      expect(result?.title).toBe('Legacy Album');
    });

    it('should return null if Spotify album not found', async () => {
      mockPrisma.album.findUnique.mockResolvedValue(null);

      const result = await service.getBySpotifyId('nonexistent-spotify-id');

      expect(result).toBeNull();
    });
  });

  describe('resolveAlbumId', () => {
    it('should resolve MBID to album ID', async () => {
      const mockAlbum = {
        id: 'album-1',
        mbid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        spotifyAlbumId: 'spotify-123',
        title: 'Test Album',
        artistsJson: [],
        coverUrl: null,
        releaseYear: 2020,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.album.findFirst.mockResolvedValue(mockAlbum as any);

      const albumId = await service.resolveAlbumId('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(albumId).toBe('album-1');
    });

    it('should resolve Spotify ID to album ID', async () => {
      const mockAlbum = {
        id: 'album-2',
        mbid: null,
        spotifyAlbumId: '1234567890abcdefghijkl',
        title: 'Spotify Album',
        artistsJson: [],
        coverUrl: null,
        releaseYear: 2020,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.album.findUnique.mockResolvedValue(mockAlbum as any);

      const albumId = await service.resolveAlbumId('1234567890abcdefghijkl');

      expect(albumId).toBe('album-2');
    });

    it('should return null for invalid identifier', async () => {
      const albumId = await service.resolveAlbumId('invalid-id');

      expect(albumId).toBeNull();
    });
  });

  describe('upsertByMbid', () => {
    it('should fetch from MusicBrainz and upsert to database', async () => {
      const mbReleaseGroup = {
        mbid: 'mb-123',
        title: 'Kid A',
        artists: [{ mbid: 'artist-123', name: 'Radiohead' }],
        releaseYear: 2000,
        primaryType: 'Album',
      };

      vi.spyOn(mockMusicBrainz, 'getReleaseGroup').mockResolvedValue(mbReleaseGroup);
      vi.spyOn(mockCoverArt, 'getCoverArtUrl').mockResolvedValue('https://example.com/cover.jpg');

      mockPrisma.album.upsert.mockResolvedValue({
        id: 'album-1',
        mbid: 'mb-123',
        spotifyAlbumId: 'mb-123',
        title: 'Kid A',
        artistsJson: [{ mbid: 'artist-123', name: 'Radiohead' }],
        coverUrl: 'https://example.com/cover.jpg',
        releaseYear: 2000,
        mbArtistId: 'artist-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await service.upsertByMbid('mb-123');

      expect(result?.title).toBe('Kid A');
      expect(mockPrisma.album.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mbid: 'mb-123' },
          create: expect.objectContaining({
            mbid: 'mb-123',
            title: 'Kid A',
          }),
        })
      );
    });
  });
});
