/**
 * MusicBrainz API types
 * Based on MusicBrainz API v2 schema
 */

export interface MBArtist {
  id: string;
  name: string;
  'sort-name': string;
}

export interface MBReleaseGroup {
  id: string;
  title: string;
  'first-release-date': string;
  'primary-type': string;
  'artist-credit': MBArtistCredit[];
}

export interface MBArtistCredit {
  name: string;
  artist: MBArtist;
}

export interface MBSearchResult {
  'release-groups': MBReleaseGroup[];
  count: number;
  offset: number;
}

export interface ReleaseGroupSearchResult {
  mbid: string;
  title: string;
  primaryArtist: {
    mbid: string;
    name: string;
  };
  releaseYear: number | null;
}

export interface ReleaseGroup {
  mbid: string;
  title: string;
  artists: Array<{
    mbid: string;
    name: string;
  }>;
  releaseYear: number | null;
  primaryType: string;
}
