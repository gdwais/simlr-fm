import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from '@/lib/repositories/user.repository';
import { createMockPrisma } from '../../helpers/mock-prisma';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new UserRepository(mockPrisma as any);
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        username: 'testuser',
        name: 'Test User',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        emailVerified: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
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

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await repository.findByUsername('testuser');

      expect(result?.username).toBe('testuser');
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'new@example.com',
        passwordHash: 'hashed',
        username: 'newuser',
        name: 'New User',
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValueOnce(mockUser);

      const result = await repository.create({
        email: 'new@example.com',
        passwordHash: 'hashed',
        username: 'newuser',
        displayName: 'New User',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.username).toBe('newuser');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          passwordHash: 'hashed',
          username: 'newuser',
          name: 'New User',
        },
      });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'updateduser',
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValueOnce(mockUser);

      const result = await repository.update('user-1', {
        username: 'updateduser',
        displayName: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(result.username).toBe('updateduser');
      expect(result.displayName).toBe('Updated Name');
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });
});
