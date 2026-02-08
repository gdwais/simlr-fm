import { describe, it, expect, beforeAll } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '@/lib/utils/token';

describe('token utilities', () => {
  beforeAll(() => {
    // Ensure JWT_SECRET is set for tests
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
    }
  });

  describe('signAccessToken', () => {
    it('should sign an access token', () => {
      const token = signAccessToken('user-123', 'test@example.com');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('signRefreshToken', () => {
    it('should sign a refresh token', () => {
      const token = signRefreshToken('user-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode valid access token', () => {
      const token = signAccessToken('user-123', 'test@example.com');
      const payload = verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe('user-123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.type).toBe('access');
    });

    it('should return null for invalid token', () => {
      const payload = verifyAccessToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('should return null for refresh token', () => {
      const refreshToken = signRefreshToken('user-123');
      const payload = verifyAccessToken(refreshToken);

      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const token = signRefreshToken('user-123');
      const payload = verifyRefreshToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe('user-123');
      expect(payload?.type).toBe('refresh');
    });

    it('should return null for invalid token', () => {
      const payload = verifyRefreshToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('should return null for access token', () => {
      const accessToken = signAccessToken('user-123', 'test@example.com');
      const payload = verifyRefreshToken(accessToken);

      expect(payload).toBeNull();
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('should return date 7 days in the future', () => {
      const expiry = getRefreshTokenExpiry();
      const now = new Date();
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 7);

      expect(expiry.getTime()).toBeGreaterThan(now.getTime());

      // Allow 1 second difference for test execution time
      expect(Math.abs(expiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });
  });
});
