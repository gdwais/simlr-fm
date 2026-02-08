import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { withAuth, getCurrentUser, requireAuth } from '@/lib/middleware/auth';
import * as tokenUtils from '@/lib/utils/token';

vi.mock('@/lib/utils/token');

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should call handler with auth context when token is valid', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));

      vi.mocked(tokenUtils.verifyAccessToken).mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
      });

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: 'access_token=valid-token',
        },
      });

      await withAuth(req, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(req, {
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should return 401 when no token provided', async () => {
      const mockHandler = vi.fn();

      const req = new NextRequest('http://localhost/api/test');

      const response = await withAuth(req, mockHandler);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: 'Unauthorized - No token provided',
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const mockHandler = vi.fn();

      vi.mocked(tokenUtils.verifyAccessToken).mockReturnValue(null);

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: 'access_token=invalid-token',
        },
      });

      const response = await withAuth(req, mockHandler);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: 'Unauthorized - Invalid token',
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return auth context when token is valid', () => {
      vi.mocked(tokenUtils.verifyAccessToken).mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
      });

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: 'access_token=valid-token',
        },
      });

      const auth = getCurrentUser(req);

      expect(auth).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should return null when no token provided', () => {
      const req = new NextRequest('http://localhost/api/test');

      const auth = getCurrentUser(req);

      expect(auth).toBeNull();
    });

    it('should return null when token is invalid', () => {
      vi.mocked(tokenUtils.verifyAccessToken).mockReturnValue(null);

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: 'access_token=invalid-token',
        },
      });

      const auth = getCurrentUser(req);

      expect(auth).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return auth context when authenticated', () => {
      vi.mocked(tokenUtils.verifyAccessToken).mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
      });

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: 'access_token=valid-token',
        },
      });

      const auth = requireAuth(req);

      expect(auth).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should throw when not authenticated', () => {
      const req = new NextRequest('http://localhost/api/test');

      expect(() => requireAuth(req)).toThrow('Unauthorized');
    });
  });
});
