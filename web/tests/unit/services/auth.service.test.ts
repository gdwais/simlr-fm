import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '@/lib/services/auth.service';
import { createMockPrisma } from '../../helpers/mock-prisma';
import * as passwordUtils from '@/lib/utils/password';
import * as tokenUtils from '@/lib/utils/token';

vi.mock('@/lib/utils/password');
vi.mock('@/lib/utils/token');

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AuthService(mockPrisma as any);

    // Setup JWT_SECRET for tests
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
    }
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock dependencies
      vi.mocked(passwordUtils.validatePassword).mockReturnValue({
        valid: true,
        errors: [],
      });
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('hashed-password');
      vi.mocked(tokenUtils.signAccessToken).mockReturnValue('access-token');
      vi.mocked(tokenUtils.signRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(tokenUtils.getRefreshTokenExpiry).mockReturnValue(new Date());

      mockPrisma.user.findUnique.mockResolvedValue(null); // Email doesn't exist
      mockPrisma.user.create.mockResolvedValue(mockUser);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        displayName: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      await expect(
        service.register({
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email address');
    });

    it('should throw error for weak password', async () => {
      vi.mocked(passwordUtils.validatePassword).mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'short',
        })
      ).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should throw error for existing email', async () => {
      vi.mocked(passwordUtils.validatePassword).mockReturnValue({
        valid: true,
        errors: [],
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(passwordUtils.verifyPassword).mockResolvedValue(true);
      vi.mocked(tokenUtils.signAccessToken).mockReturnValue('access-token');
      vi.mocked(tokenUtils.signRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(tokenUtils.getRefreshTokenExpiry).mockReturnValue(new Date());

      // First call for findByEmail (in UserRepository)
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      // Second call for password check
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        passwordHash: 'hashed-password',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await service.login('test@example.com', 'password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      };

      vi.mocked(passwordUtils.verifyPassword).mockResolvedValue(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        service.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      vi.mocked(tokenUtils.verifyRefreshToken).mockReturnValue({
        userId: 'user-1',
        type: 'refresh',
      });
      vi.mocked(tokenUtils.signAccessToken).mockReturnValue('new-access-token');
      vi.mocked(tokenUtils.signRefreshToken).mockReturnValue('new-refresh-token');
      vi.mocked(tokenUtils.getRefreshTokenExpiry).mockReturnValue(futureDate);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        token: 'old-refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.refreshToken.delete.mockResolvedValue({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshToken('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      vi.mocked(tokenUtils.verifyRefreshToken).mockReturnValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error for expired token', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      vi.mocked(tokenUtils.verifyRefreshToken).mockReturnValue({
        userId: 'user-1',
        type: 'refresh',
      });

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        token: 'expired-token',
        expiresAt: pastDate,
        createdAt: new Date(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrisma.refreshToken.delete.mockResolvedValue({} as any);

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        'Refresh token expired'
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('user-1', 'refresh-token');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          token: 'refresh-token',
        },
      });
    });
  });

  describe('logoutAll', () => {
    it('should delete all refresh tokens for user', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.logoutAll('user-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
