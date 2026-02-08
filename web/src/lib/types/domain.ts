/**
 * Domain types for Simlr.fm
 * These represent our core business entities
 */

export interface Artist {
  mbid: string;
  name: string;
}

export interface Album {
  id: string;
  mbid: string | null;
  spotifyAlbumId: string | null;
  title: string;
  artists: Artist[];
  coverUrl: string | null;
  releaseYear: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumStats {
  ratingCount: number;
  averageRating: number | null;
  medianRating: number | null;
  histogram: Record<number, number>; // rating (1-10) -> count
}

export interface AlbumDetail extends Album {
  stats: AlbumStats;
}

export interface AlbumSearchResult {
  mbid: string;
  title: string;
  artists: Artist[];
  coverUrl: string | null;
  releaseYear: number | null;
}

export interface User {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  userId: string;
  albumId: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertAlbumData {
  mbid: string;
  title: string;
  artists: Artist[];
  coverUrl: string | null;
  releaseYear: number | null;
  mbArtistId?: string | null;
}
