/**
 * User Repository
 * Handles all database operations for users
 */

import type { PrismaClient } from '@prisma/client';
import type { User } from '../types/domain';
import type {
  UserRepository as IUserRepository,
  CreateUserData,
  UpdateUserData,
} from './types';

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapToUser(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.mapToUser(user) : null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return user ? this.mapToUser(user) : null;
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        username: data.username,
        name: data.displayName,
      },
    });

    return this.mapToUser(user);
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        name: data.displayName,
        image: data.avatarUrl,
      },
    });

    return this.mapToUser(user);
  }

  /**
   * Map Prisma user to domain User
   */
  private mapToUser(user: {
    id: string;
    email: string | null;
    username: string | null;
    name: string | null;
    image: string | null;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email || '',
      username: user.username,
      displayName: user.name,
      avatarUrl: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
