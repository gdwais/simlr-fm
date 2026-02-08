/**
 * Authentication Service
 * Handles user registration, login, token refresh, and logout
 */

import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/token';
import type { User } from '../types/domain';
import { UserRepository } from '../repositories/user.repository';

const emailSchema = z.string().email();

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor(private prisma: PrismaClient) {
    this.userRepo = new UserRepository(prisma);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    // Validate email
    const emailValidation = emailSchema.safeParse(data.email);
    if (!emailValidation.success) {
      throw new Error('Invalid email address');
    }

    // Validate password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors[0]);
    }

    // Check if email already exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    if (data.username) {
      const existingUsername = await this.userRepo.findByUsername(data.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.userRepo.create({
      email: data.email,
      passwordHash,
      username: data.username,
      displayName: data.displayName,
    });

    // Generate tokens
    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user has a password (might be OAuth-only user)
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser?.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await verifyPassword(password, dbUser.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenString: string): Promise<AuthResult> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshTokenString);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Check if token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
    });

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new Error('Refresh token expired');
    }

    // Get user
    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const accessToken = signAccessToken(user.id, user.email);
    const newRefreshToken = signRefreshToken(user.id);

    // Store new refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user (delete refresh token)
   */
  async logout(userId: string, refreshTokenString: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshTokenString,
      },
    });
  }

  /**
   * Logout all sessions (delete all refresh tokens for user)
   */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
