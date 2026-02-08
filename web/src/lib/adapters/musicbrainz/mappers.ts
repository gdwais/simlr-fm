/**
 * Data transformation functions for MusicBrainz API responses
 */

import type {
  MBReleaseGroup,
  ReleaseGroupSearchResult,
  ReleaseGroup,
} from './types';

/**
 * Extract release year from MusicBrainz date string
 * Formats: "YYYY", "YYYY-MM", "YYYY-MM-DD"
 */
export function extractReleaseYear(dateString: string | undefined): number | null {
  if (!dateString) return null;
  const year = parseInt(dateString.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

/**
 * Map MusicBrainz release group to search result
 */
export function mapSearchResult(rg: MBReleaseGroup): ReleaseGroupSearchResult {
  const primaryArtist = rg['artist-credit']?.[0];

  return {
    mbid: rg.id,
    title: rg.title,
    primaryArtist: {
      mbid: primaryArtist?.artist?.id || '',
      name: primaryArtist?.name || 'Unknown Artist',
    },
    releaseYear: extractReleaseYear(rg['first-release-date']),
  };
}

/**
 * Map MusicBrainz release group to full release group object
 */
export function mapReleaseGroup(rg: MBReleaseGroup): ReleaseGroup {
  const artists = rg['artist-credit']?.map((credit) => ({
    mbid: credit.artist.id,
    name: credit.name,
  })) || [];

  return {
    mbid: rg.id,
    title: rg.title,
    artists,
    releaseYear: extractReleaseYear(rg['first-release-date']),
    primaryType: rg['primary-type'] || 'Album',
  };
}
