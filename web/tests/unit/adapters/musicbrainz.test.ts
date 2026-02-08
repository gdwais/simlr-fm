import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MusicBrainzAdapter } from '@/lib/adapters/musicbrainz';
import { createMockResponse } from '../../helpers/mock-fetch';

describe('MusicBrainzAdapter', () => {
  let adapter: MusicBrainzAdapter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    adapter = new MusicBrainzAdapter();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('searchReleaseGroups', () => {
    it('should search for albums and return results', async () => {
      const mockData = {
        'release-groups': [
          {
            id: '12345-abcde',
            title: 'OK Computer',
            'first-release-date': '1997-05-21',
            'primary-type': 'Album',
            'artist-credit': [
              {
                name: 'Radiohead',
                artist: {
                  id: 'artist-12345',
                  name: 'Radiohead',
                  'sort-name': 'Radiohead',
                },
              },
            ],
          },
        ],
        count: 1,
        offset: 0,
      };

      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse(mockData)));

      const results = await adapter.searchReleaseGroups('radiohead ok computer');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        mbid: '12345-abcde',
        title: 'OK Computer',
        primaryArtist: {
          mbid: 'artist-12345',
          name: 'Radiohead',
        },
        releaseYear: 1997,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('musicbrainz.org/ws/2/release-group'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'simlr-fm/1.0 ( contact@simlr.fm )',
          }),
        })
      );
    });

    it('should handle empty search results', async () => {
      const mockData = {
        'release-groups': [],
        count: 0,
        offset: 0,
      };

      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse(mockData)));

      const results = await adapter.searchReleaseGroups('nonexistent album xyz');

      expect(results).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const mockData = {
        'release-groups': [],
        count: 0,
        offset: 0,
      };

      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse(mockData)));

      await adapter.searchReleaseGroups('test', 10);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });

    it('should handle missing release date', async () => {
      const mockData = {
        'release-groups': [
          {
            id: '12345-abcde',
            title: 'Test Album',
            'first-release-date': '',
            'primary-type': 'Album',
            'artist-credit': [
              {
                name: 'Test Artist',
                artist: {
                  id: 'artist-12345',
                  name: 'Test Artist',
                  'sort-name': 'Artist, Test',
                },
              },
            ],
          },
        ],
        count: 1,
        offset: 0,
      };

      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse(mockData)));

      const results = await adapter.searchReleaseGroups('test');

      expect(results[0].releaseYear).toBeNull();
    });
  });

  describe('getReleaseGroup', () => {
    it('should fetch release group by MBID', async () => {
      const mockData = {
        id: '12345-abcde',
        title: 'In Rainbows',
        'first-release-date': '2007-10-10',
        'primary-type': 'Album',
        'artist-credit': [
          {
            name: 'Radiohead',
            artist: {
              id: 'artist-12345',
              name: 'Radiohead',
              'sort-name': 'Radiohead',
            },
          },
        ],
      };

      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse(mockData)));

      const result = await adapter.getReleaseGroup('12345-abcde');

      expect(result).toEqual({
        mbid: '12345-abcde',
        title: 'In Rainbows',
        artists: [
          {
            mbid: 'artist-12345',
            name: 'Radiohead',
          },
        ],
        releaseYear: 2007,
        primaryType: 'Album',
      });
    });

    it.skip('should return null for 404 errors', async () => {
      // TODO: Fix rate limiter queue interference in tests
      // Create fresh adapter to avoid rate limiter queue issues
      const testAdapter = new MusicBrainzAdapter();
      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse({}, 404)));

      const result = await testAdapter.getReleaseGroup('nonexistent-mbid');

      expect(result).toBeNull();
    }, 10000);

    it.skip('should throw for other errors', async () => {
      // TODO: Fix rate limiter queue interference in tests
      // Create fresh adapter to avoid rate limiter queue issues
      const testAdapter = new MusicBrainzAdapter();
      fetchMock.mockImplementationOnce(() => Promise.resolve(createMockResponse({}, 500)));

      await expect(testAdapter.getReleaseGroup('error-mbid')).rejects.toThrow(
        'MusicBrainz API error'
      );
    }, 10000);
  });

  describe('retry logic', () => {
    it('should retry on 503 errors', async () => {
      const mockData = {
        'release-groups': [],
        count: 0,
        offset: 0,
      };

      // First call fails with 503, second succeeds
      fetchMock
        .mockImplementationOnce(() => Promise.resolve(createMockResponse({}, 503)))
        .mockImplementationOnce(() => Promise.resolve(createMockResponse(mockData)));

      const results = await adapter.searchReleaseGroups('test');

      expect(results).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should give up after max retries', async () => {
      // All calls fail with 503
      fetchMock.mockImplementation(() => Promise.resolve(createMockResponse({}, 503)));

      await expect(adapter.searchReleaseGroups('test')).rejects.toThrow(
        'MusicBrainz API error: 503'
      );

      expect(fetchMock).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 15000);
  });
});
