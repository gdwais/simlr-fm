/**
 * MusicBrainz API Adapter
 * Provides interface to MusicBrainz web service v2
 */

import { RateLimiter } from './rate-limiter';
import { mapSearchResult, mapReleaseGroup } from './mappers';
import type {
  MBSearchResult,
  MBReleaseGroup,
  ReleaseGroupSearchResult,
  ReleaseGroup,
} from './types';

const BASE_URL = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'simlr-fm/1.0 ( contact@simlr.fm )';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export class MusicBrainzAdapter {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter(1); // 1 request per second
  }

  /**
   * Search for release groups (albums)
   */
  async searchReleaseGroups(
    query: string,
    limit = 25
  ): Promise<ReleaseGroupSearchResult[]> {
    const url = new URL(`${BASE_URL}/release-group`);
    url.searchParams.set('query', query);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('fmt', 'json');

    const data = await this.rateLimiter.execute(() =>
      this.fetchWithRetry<MBSearchResult>(url.toString())
    );

    return data['release-groups'].map(mapSearchResult);
  }

  /**
   * Get a specific release group by MBID
   */
  async getReleaseGroup(mbid: string): Promise<ReleaseGroup | null> {
    const url = new URL(`${BASE_URL}/release-group/${mbid}`);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('inc', 'artist-credits');

    try {
      const data = await this.rateLimiter.execute(() =>
        this.fetchWithRetry<MBReleaseGroup>(url.toString())
      );
      return mapReleaseGroup(data);
    } catch (error) {
      // Return null for 404 (not found)
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch with retry logic for 503 errors
   */
  private async fetchWithRetry<T>(
    url: string,
    attempt = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        // Retry on 503 (Service Unavailable)
        if (response.status === 503 && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.fetchWithRetry<T>(url, attempt + 1);
        }

        throw new Error(
          `MusicBrainz API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (attempt < MAX_RETRIES && error instanceof Error) {
        // Retry on network errors
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry<T>(url, attempt + 1);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const musicbrainzAdapter = new MusicBrainzAdapter();
