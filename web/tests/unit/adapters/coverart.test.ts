import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CoverArtAdapter } from '@/lib/adapters/coverart';
import { setupFetchMock, resetFetchMock } from '../../helpers/mock-fetch';

describe('CoverArtAdapter', () => {
  let adapter: CoverArtAdapter;
  let fetchMock: ReturnType<typeof setupFetchMock>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
    adapter = new CoverArtAdapter();
  });

  afterEach(() => {
    resetFetchMock();
  });

  describe('getCoverArtUrl', () => {
    it('should return URL when cover art exists', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const url = await adapter.getCoverArtUrl('12345-abcde', 'large');

      expect(url).toBe(
        'https://coverartarchive.org/release-group/12345-abcde/front-500'
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('coverartarchive.org'),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('should return null when cover art does not exist (404)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const url = await adapter.getCoverArtUrl('nonexistent-mbid', 'large');

      expect(url).toBeNull();
    });

    it('should use small size when specified', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const url = await adapter.getCoverArtUrl('12345-abcde', 'small');

      expect(url).toBe(
        'https://coverartarchive.org/release-group/12345-abcde/front-250'
      );
    });

    it('should default to large size', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const url = await adapter.getCoverArtUrl('12345-abcde');

      expect(url).toContain('front-500');
    });

    it('should throw for non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(adapter.getCoverArtUrl('error-mbid')).rejects.toThrow(
        'Cover Art Archive error: 500'
      );
    });

    it('should return null for network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('fetch failed'));

      const url = await adapter.getCoverArtUrl('network-error-mbid');

      expect(url).toBeNull();
    });
  });

  describe('hasCoverArt', () => {
    it('should return true when cover art exists', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const exists = await adapter.hasCoverArt('12345-abcde');

      expect(exists).toBe(true);
    });

    it('should return false when cover art does not exist', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const exists = await adapter.hasCoverArt('nonexistent-mbid');

      expect(exists).toBe(false);
    });
  });
});
