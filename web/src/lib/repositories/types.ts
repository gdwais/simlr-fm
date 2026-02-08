/**
 * Repository interface types
 */

import type {
  Album,
  AlbumStats,
  UpsertAlbumData,
  User,
  Rating,
} from '../types/domain';

export interface AlbumRepository {
  findByMbid(mbid: string): Promise<Album | null>;
  findBySpotifyId(spotifyId: string): Promise<Album | null>;
  findById(id: string): Promise<Album | null>;
  upsertByMbid(data: UpsertAlbumData): Promise<Album>;
  getStats(albumId: string): Promise<AlbumStats>;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
}

export interface RatingRepository {
  findByUserAndAlbum(userId: string, albumId: string): Promise<Rating | null>;
  findByAlbum(albumId: string): Promise<Rating[]>;
  upsert(data: UpsertRatingData): Promise<Rating>;
  delete(userId: string, albumId: string): Promise<void>;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  username?: string;
  displayName?: string;
}

export interface UpdateUserData {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface UpsertRatingData {
  userId: string;
  albumId: string;
  rating: number;
}
