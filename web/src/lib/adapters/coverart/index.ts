/**
 * Cover Art Archive Adapter
 * Provides interface to Cover Art Archive API
 */

import type { CoverArtSize } from './types';

const BASE_URL = 'https://coverartarchive.org';

export class CoverArtAdapter {
  /**
   * Get cover art URL for a release group
   * Returns direct URL to image, or null if not available
   */
  async getCoverArtUrl(
    releaseGroupMbid: string,
    size: CoverArtSize = 'large'
  ): Promise<string | null> {
    // Cover Art Archive provides direct URLs with size suffix
    const sizeMap = {
      small: 'front-250',
      large: 'front-500',
    };

    const url = `${BASE_URL}/release-group/${releaseGroupMbid}/${sizeMap[size]}`;

    try {
      // HEAD request to check if image exists
      const response = await fetch(url, { method: 'HEAD' });

      if (response.ok) {
        return url;
      }

      // 404 means no cover art available
      if (response.status === 404) {
        return null;
      }

      // Other errors
      throw new Error(
        `Cover Art Archive error: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      // Network errors - treat as unavailable
      if (error instanceof Error && error.message.includes('fetch')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if cover art exists for a release group
   */
  async hasCoverArt(releaseGroupMbid: string): Promise<boolean> {
    const url = await this.getCoverArtUrl(releaseGroupMbid);
    return url !== null;
  }
}

// Export singleton instance
export const coverArtAdapter = new CoverArtAdapter();
